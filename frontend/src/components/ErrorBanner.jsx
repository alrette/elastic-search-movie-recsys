import React from 'react';

export default function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
        {message}
        </div>
    );
}