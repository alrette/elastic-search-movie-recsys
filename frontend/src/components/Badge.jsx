import React from 'react';

export default function Badge({ children }) {
    return (
        <span className="inline-flex items-center rounded-full bg-gray-700/70 px-3 py-1 text-xs font-medium text-gray-200">
        {children}
        </span>
    );
}
