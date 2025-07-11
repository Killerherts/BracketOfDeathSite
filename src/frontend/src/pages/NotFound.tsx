import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-gray-400 text-6xl">🎾</span>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="btn btn-primary inline-flex items-center"
          >
            <span className="mr-2">🏠</span>
            Back to Home
          </Link>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/players" 
              className="btn btn-secondary inline-flex items-center"
            >
              <span className="mr-2">👥</span>
              View Players
            </Link>
            
            <Link 
              to="/tournaments" 
              className="btn btn-secondary inline-flex items-center"
            >
              <span className="mr-2">🏆</span>
              View Tournaments
            </Link>
            
            <Link 
              to="/results" 
              className="btn btn-secondary inline-flex items-center"
            >
              <span className="mr-2">📊</span>
              View Results
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;