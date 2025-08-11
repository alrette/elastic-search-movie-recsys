from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api_routes import router as api_router


app = FastAPI(title="This is an Application for Recommendation System for Movies that powered by Fast Api and Elasticsearch")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

app.include_router(api_router, prefix="/api", tags=["API"])

@app.get("/", tags = ["Root"])
def read_for_root():
    return {"message": "Welcome to the Movie Recommendation System API. Use /api for accessing the endpoints."}