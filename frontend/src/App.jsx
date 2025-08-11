import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";

function App() {
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const handleSelectMovie = (id) => {
    setSelectedMovieId(id);
  };

  const handleGoBack = () => {
    setSelectedMovieId(null);
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-gray-900 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1
            className="text-2xl md:text-3xl font-bold text-white tracking-wider cursor-pointer"
            onClick={handleGoBack}
          >
            🎬 Semantic Movie Search
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {selectedMovieId ? (
          // We now pass the function so we can select a new movie from the recommendations
          <MovieDetailPage
            movieId={selectedMovieId}
            onGoBack={handleGoBack}
            onSelectMovie={handleSelectMovie}
          />
        ) : (
          <HomePage onSelectMovie={handleSelectMovie} />
        )}
      </main>
    </div>
  );
}

export default App;
