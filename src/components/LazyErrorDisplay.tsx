import React from 'react';

interface LazyErrorDisplayProps {
  error: Error | null;
}

const LazyErrorDisplay: React.FC<LazyErrorDisplayProps> = ({ error }) => {
  return (
    <div className="p-4 bg-red-100 text-red-800 rounded">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      {error && <p>{error.message}</p>}
    </div>
  );
};

export default LazyErrorDisplay;