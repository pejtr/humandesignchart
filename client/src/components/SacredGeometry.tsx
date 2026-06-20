import React from 'react';

export const SacredGeometry: React.FC<{ type?: 'flower-of-life' | 'metatron', className?: string }> = ({ type = 'flower-of-life', className = "" }) => {
    if (type === 'flower-of-life') {
        return (
            <svg
                className={`opacity-[0.03] pointer-events-none ${className}`}
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern id="flower" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="0" cy="10" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="20" cy="10" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="10" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="10" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="5" cy="5" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="15" cy="5" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="5" cy="15" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                        <circle cx="15" cy="15" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#flower)" />
            </svg>
        );
    }

    return null;
};
