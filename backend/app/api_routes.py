import os
import time
import asyncio
from dotenv import load_dotenv
from typing import List, Dict, Any
import httpx
from fastapi import APIRouter, HTTPException, Query
from elasticsearch import Elasticsearch
from elastic_transport import ApiError
from pathlib import Path
from sentence_transformers import SentenceTransformer
import numpy as np
import torch

print(torch.cuda.is_available(), torch.cuda.get_device_name(0))

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

# debugging
print(f"TMDB API Key Loaded: {os.getenv('TMDB_API_KEY')}")

router = APIRouter()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
INDEX_NAME = "movies"

ELASTIC_SEARCH_URL = os.getenv("ELASTIC_URL", "http://localhost:9200")

mxbai_model = SentenceTransformer("mixedbread-ai/mxbai-embed-large-v1", device=DEVICE)

def encode_query(text: str):
    prompt = f"Represent this sentence for searching relevant passages: {text}"
    with torch.inference_mode():
        emb = mxbai_model.encode(
            prompt,
            batch_size=1,               
            normalize_embeddings=True,
            convert_to_numpy=True,
            device=DEVICE               
        )
    return emb.tolist()

# To connect + retry
elastic_search_client : Elasticsearch | None = None
def connect_es(retries:int = 5, delay:float = 1.0) -> Elasticsearch | None:
    client = None
    for _ in range(retries):
        try : 
            client = Elasticsearch(ELASTIC_SEARCH_URL)
            # if ping successful, then return the client 
            if client.ping():
                return client
        except Exception:
            pass
        time.sleep(delay) # before another retry
        
    return client

# Just retry and retry, if 503, then its really not avail
def ensure_es() -> Elasticsearch:
    global elastic_search_client
    if elastic_search_client is None:
        elastic_search_client = connect_es()
    try:
        if not elastic_search_client :
            elastic_search_client = connect_es()
    except Exception:
        elastic_search_client = connect_es()
        
    if elastic_search_client is None:
        raise HTTPException(status_code=503, detail = "Elastic Search is not available right now 😭😭")
    
    return elastic_search_client

# Validate movie id to prevent movie that is not in dataset
def movie_id_validation(val: Any) -> int | None:
    if val is None:
        return None
    s = str(val).strip()
    
    return int(s) if s.isdigit() else None

# enrich movies information with TMDB API
async def fetch_from_tmdb(movies:List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not TMDB_API_KEY:
        return [{**m, "poster_url":None} for m in movies]
    
    async def fetch_movie(movie:Dict[str, any]) -> Dict[str, Any]:
        mov_id = movie_id_validation(movie.get("id"))
        if mov_id is None:
            return {**movie, "poster_url":None}
        
        try :
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{TMDB_BASE_URL}/movie/{mov_id}", params={"api_key":TMDB_API_KEY})
                resp.raise_for_status()
                data = resp.json()
            poster_path = data.get("poster_path")
            return {**movie, "poster_url" : f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None}
        except Exception:
            return {**movie, "poster_url":None}
        
    return await asyncio.gather(*[fetch_movie(movie) for movie in movies])

@router.get("/search", tags = ["Movies"])
async def search_movies_info(q:str, from_:int = Query(0, ge=0), size:int = Query(20, ge = 1, le = 50)):
    es = ensure_es()
    
    query_emb = encode_query(q)
    
    query ={
        "multi_match":{
            "query":q,
            "fields" : ["title^3", "overview", "actor", "director"],
            "fuzziness" : "AUTO"
        }
    }
    
    try:
        response = es.search(
            index = INDEX_NAME,
            knn = {
                "field": "movie_embedding",
                "query_vector": query_emb,
                "k": size,
                "num_candidates": size * 4
            },
            query = query,
            from_ = from_,
            size = size
        )
        
        hits = (response.get("hits") or {}).get("hits") or []
        results = [(h.get("_source") or {}) for h in hits]
        
        if not results:
            return {"results" : []}
        
        try:
            enriched_mov = await fetch_from_tmdb(results)
        except Exception:
            enriched_mov = [{**m, "poster_url":None} for m in results]
            
        return {"results":enriched_mov}
    except ApiError as e:
        detail = getattr(e, "message", str(e))
        raise HTTPException(status_code=502, detail = f"Elastic Search Api Error : {detail}")
    except Exception:
        return {"results":[]}
    
@router.get("/movie/{movie_id}", tags = ["Movies"])
async def get_recommendation(movie_id : int):
    es= ensure_es()
    
    try:
        source_doc_response = es.get(index= INDEX_NAME, id = movie_id)
        
        if not source_doc_response.get("found"):
            raise HTTPException(status_code=404, detail=f"Movie with ID '{movie_id}' not found")
        
        source_movie = source_doc_response.get("_source") or {}
        if "movie_embedding" not in source_movie or not source_movie["movie_embedding"]:
            details = (await fetch_from_tmdb([source_movie]))[0]
            return {"details" : details, "recommendations":[]}
        
        source_embedding = source_movie["movie_embedding"]
        
        # for recommendation, find the closest embedding with KNN
        knn_query = {
            "field" : "movie_embedding",
            "query_vector" : source_embedding,
            "k" :15,
            "num_candidates" : 200
        }
        
        # to exclude the original movie
        fin_query = {
            "bool": {
                "must_not" :{
                    "ids" :{"values": [str(movie_id)]}
                }
            }
        }
        
        rec_response = es.search(
            index = INDEX_NAME,
            knn = knn_query,
            query = fin_query,
            size = 15
        )
        
        rec_hits = (rec_response.get("hits") or {}).get("hits") or []
        recommendations = [(h.get("_source") or {}) for h in rec_hits]

        details, enriched_recom = await asyncio.gather(
            fetch_from_tmdb([source_movie]),
            fetch_from_tmdb(recommendations),
        )
        
        return {"details" : details[0], "recommendations": enriched_recom}
    
    except ApiError as e:
        detail = getattr(e, "message", str(e))
        raise HTTPException(status_code=502, detail=f"Elasticsearch ApiError: {detail}")
    except Exception:
        details = (await fetch_from_tmdb([{"id": movie_id}]))[0]
        return {"details": details, "recommendations": []}
