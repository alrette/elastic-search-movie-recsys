# 🎬 Elastic Search Movie Recommender System

A semantic search movie recommendation system powered by Elasticsearch, FastAPI, and React.
Search movies by title, overview, or cast/director, view details, and get AI-powered recommendations in real time.

# 🚀 Features
- 🔍 Semantic Search using mxbai-embed-large-v1 from Sentence Transformers
- 🎭 Detailed Movie Metadata from TMDB API (poster, overview, genres, cast, director)
- ⚡ FastAPI Backend for API endpoints
- 🎨 Responsive UI built with React + TailwindCSS
- 🔗 Vector Search (kNN) in Elasticsearch for recommendations
- 📋 Prerequisites

# Make sure you have:
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- A TMDB API key → Get one here https://developer.themoviedb.org.

# ⚙️ Installation & Setup
## 1️⃣ Clone the Repository
<pre lang="bash"> git clone https://github.com/&lt;alrette&gt;/elastic-search-movie-recsys.git <br> cd elastic-search-movie-recsys </pre>

## 2️⃣ Start Elasticsearch via Docker Compose
Run from the project root:

<pre lang="bash"> docker-compose up -d </pre>

This starts:
- Elasticsearch (for search & recommendations)

## 3️⃣ Backend Setup
<pre lang="bash"> cd backend pip install -r requirements.txt uvicorn app.main:app --reload </pre>
Create .env in backend/:

<pre lang="bash"> TMDB_API_KEY=your_tmdb_api_key ELASTICSEARCH_HOST=http://localhost:9200 </pre>

## 4️⃣ Frontend Setup
<pre lang="bash"> cd frontend npm install npm run dev </pre>