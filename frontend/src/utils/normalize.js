export function toArray(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x.filter(Boolean);
    if (typeof x === 'string') return x.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

export function normalizeMovie(raw = {}) {
    const id = raw.id ?? raw.movie_id ?? raw._id ?? null;
    const title = raw.title ?? raw.name ?? 'Untitled';
    const poster_url = raw.poster_url ?? null;
    const overview = raw.overview ?? '';
    const genres = toArray(raw.genres ?? raw.genres_list ?? raw.genre_names ?? raw.genre);
    const actors = toArray(raw.actors ?? raw.actor);
    const year = raw.release_year ?? (raw.release_date?.slice?.(0, 4) ?? null);
    const rating = raw.vote_average ?? raw.rating ?? null;
    const director = raw.director ?? null;
    return { id, title, poster_url, overview, genres, actors, year, rating, director, _raw: raw };
}

export function normalizeMovies(list = []) {
    return list.map(normalizeMovie).filter(m => m.id != null);
}
