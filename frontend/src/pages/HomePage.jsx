import React, { useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import { normalizeMovies } from '../utils/normalize';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import ErrorBanner from '../components/ErrorBanner';

function useDebounce(fn, delay) {
    const t = useRef();
    return useCallback((...args) => {
        clearTimeout(t.current);
        t.current = setTimeout(() => fn(...args), delay);
    }, [fn, delay]);
}

export default function HomePage({ onSelectMovie }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const controllerRef = useRef(null);

    const searchMovies = useCallback(async (q) => {
        if (controllerRef.current) controllerRef.current.abort();
        if (!q || q.trim().length < 2) {
            setResults([]);
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const { data } = await api.get('/search', {
                params: { q },
                signal: controller.signal,
            });
            setResults(normalizeMovies(data?.results ?? []));
        } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            const status = err?.response?.status;
            if (status === 503) setError('Search backend is unavailable (503). Make sure Elasticsearch is running.');
            else if (status === 502) setError('Search service had an upstream error (502). Check Elasticsearch logs.');
            else setError('Could not connect to the server.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedSearch = useDebounce(searchMovies, 350);

    const handleInputChange = (e) => {
        const v = e.target.value;
        setQuery(v);
        debouncedSearch(v);
    };

    return (
        <div>
            <div className="mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Search by title, actor, or plot..."
                    className="w-full p-4 text-lg bg-gray-800 border-2 border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
            </div>

            <ErrorBanner message={error} />

            {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {!loading && results.length === 0 && query.trim().length >= 2 && !error && (
                <div className="text-center text-gray-400">No results for “{query}”. Try another keyword.</div>
            )}

            {!loading && results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {results.map((m) => (
                        <MovieCard key={m.id} movie={m} onSelectMovie={onSelectMovie} />
                    ))}
                </div>
            )}
        </div>
    );
}