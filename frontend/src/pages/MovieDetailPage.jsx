import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { normalizeMovie, normalizeMovies } from '../utils/normalize';
import MovieCard from '../components/MovieCard';
import Badge from '../components/Badge';
import ErrorBanner from '../components/ErrorBanner';

const FALLBACK = 'https://placehold.co/500x750/1f2937/ffffff?text=No+Image';

export default function MovieDetailPage({ movieId, onGoBack, onSelectMovie }) {
    const [details, setDetails] = useState(null);
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const { data } = await api.get(`/movie/${movieId}`);
                if (!alive) return;
                const d = normalizeMovie(data?.details ?? {});
                const r = normalizeMovies(data?.recommendations ?? []);
                setDetails(d);
                setRecs(r);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                if (!alive) return;
                const status = err?.response?.status;
                if (status === 404) setError('Movie not found (404).');
                else if (status === 503) setError('Service unavailable (503). Make sure Elasticsearch is running.');
                else setError('Failed to fetch movie details.');
                console.error(err);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [movieId]);

    if (loading) return <p className="text-center">Loading movie details...</p>;
    if (error) return <ErrorBanner message={error} />;
    if (!details) return null;

    const { title, poster_url, director, overview, genres, actors, year, rating } = details;

    return (
        <div>
            <button
                onClick={onGoBack}
                className="mb-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                &larr; Back to Search
            </button>

            <div className="flex flex-col md:flex-row gap-8 mb-12">
                <div className="md:w-1/3">
                    <img
                        src={poster_url || FALLBACK}
                        alt={title}
                        className="w-full h-auto rounded-xl shadow-xl"
                        onError={(e) => { e.currentTarget.src = FALLBACK; }}
                    />
                </div>
                <div className="md:w-2/3">
                    <h2 className="text-4xl font-extrabold mb-2">{title}</h2>
                    <div className="text-gray-400 mb-2">
                        {year && <span className="mr-3">{year}</span>}
                        {typeof rating === 'number' && <span>★ {rating.toFixed(1)}</span>}
                    </div>
                    <p className="text-lg text-gray-300 mb-4">
                        Directed by: <span className="text-white">{director || 'N/A'}</span>
                    </p>
                    <p className="text-gray-200 mb-6">{overview || 'No overview available.'}</p>

                    {genres?.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {genres.map((g) => <Badge key={g}>{g}</Badge>)}
                        </div>
                    )}

                    {actors?.length > 0 && (
                        <div className="mb-4">
                            <div className="text-sm text-gray-400 mb-1">Cast</div>
                            <div className="flex flex-wrap gap-2">
                                {actors.slice(0, 12).map((a) => <Badge key={a}>{a}</Badge>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">You might also like…</h3>
                {recs.length === 0 ? (
                    <div className="text-gray-400">No recommendations available.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {recs.map((m) => (
                            <MovieCard key={m.id} movie={m} onSelectMovie={onSelectMovie} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}