import React from 'react';

function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner', 
  className = '',
  text = ''
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const spinnerSizeClasses = sizeClasses[size] || sizeClasses.md;

  if (variant === 'skeleton') {
    return <Skeleton className={className} />;
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" 
             style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" 
             style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" 
             style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${spinnerSizeClasses} bg-primary-600 rounded-full animate-ping`}></div>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${spinnerSizeClasses} text-primary-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}

// tried to make this flexible enough to use everywhere
export function Skeleton({ 
  type = 'text', 
  lines = 3, 
  className = '',
  animate = true 
}) {
  const animateClass = animate ? 'animate-pulse' : '';
  
  if (type === 'card') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${animateClass} ${className}`}>
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          {[...Array(lines)].map((_, i) => (
            <div key={i} className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${
              i === lines - 1 ? 'w-5/6' : 'w-full'
            }`}></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'text') {
    return (
      <div className={`space-y-2 ${animateClass} ${className}`}>
        {[...Array(lines)].map((_, i) => (
          <div key={i} className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}></div>
        ))}
      </div>
    );
  }
  
  // Default: single line
  return (
    <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${animateClass} ${className}`}></div>
  );
}

// for the doc list when its loading
export function DocumentSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} type="card" lines={2} />
      ))}
    </div>
  );
}

// editor loading state here shows the layout while quill loads
export function EditorSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-gray-800 p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton type="text" lines={5} />
      </div>
    </div>
  );
}

export default LoadingSpinner;
