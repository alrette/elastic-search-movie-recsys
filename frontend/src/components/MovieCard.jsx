import React from 'react';
import Badge from './Badge';

const FALLBACK = 'https://placehold.co/500x750/1f2937/ffffff?text=No+Image';

export default function MovieCard({ movie, onSelectMovie }) {
    const { id, title, poster_url, year, genres, actors } = movie;

    return (
        <div
            className="bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-200"
            onClick={() => onSelectMovie(id)}
        >
            <img
                src={poster_url || FALLBACK}
                alt={title}
                className="w-full h-auto aspect-[2/3] object-cover"
                onError={(e) => { e.currentTarget.src = FALLBACK; }}
                loading="lazy"
            />
            <div className="p-3">
                <h3 className="font-semibold text-sm text-white truncate">{title}</h3>
                <div className="text-xs text-gray-400">{year ?? '—'}</div>

                <div className="mt-2 flex flex-wrap gap-1">
                    {genres?.slice(0, 3).map((g) => <Badge key={g}>{g}</Badge>)}
                </div>
                {actors?.length > 0 && (
                    <div className="mt-2 text-xs text-gray-300 truncate">
                        {actors.slice(0, 3).join(', ')}
                    </div>
                )}
            </div>
        </div>
    );
}