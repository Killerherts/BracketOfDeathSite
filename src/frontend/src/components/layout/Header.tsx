import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              Bracket of Death
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Tennis Tournament Score Tracking
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {/* TODO: Add user info and login/logout */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;