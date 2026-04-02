import React from 'react';

const LoadingSpinner = ({ message = "Loading...", size = "medium", color = "#6E39CB" }) => {
    const sizeClasses = {
        small: "w-6 h-6 border-2",
        medium: "w-10 h-10 border-4",
        large: "w-16 h-16 border-8"
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 text-[#6E39CB] font-bold">
            <div
                className={`${sizeClasses[size]} border-${color} border-t-transparent rounded-full animate-spin`}
                style={{ borderColor: color, borderTopColor: 'transparent' }}
            ></div>
            {message && <p className="text-sm md:text-base">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;