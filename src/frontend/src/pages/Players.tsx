import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import apiClient from '../services/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Players: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    winningPercentage_min: undefined as number | undefined,
    winningPercentage_max: undefined as number | undefined,
    totalChampionships_min: undefined as number | undefined,
    sort: 'name',
  });

  const getPlayers = useCallback(
    () => {
      if (search.trim()) {
        return apiClient.searchPlayers(search.trim(), { 
          page, 
          limit: 20, 
          ...filters 
        });
      } else {
        return apiClient.getPlayers({ 
          page, 
          limit: 20, 
          ...filters 
        });
      }
    },
    [page, filters, search]
  );

  const { data: players, loading, error, execute } = useApi(
    getPlayers,
    { 
      immediate: true,
      dependencies: [page, filters, search]
    }
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: key.includes('_min') || key.includes('_max') 
        ? (value === '' ? undefined : parseInt(value) / 100) // Convert percentage to decimal
        : value 
    }));
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    // The search will be triggered automatically by the dependencies change
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600">Manage player profiles and statistics</p>
        </div>
        <Link to="/players/create" className="btn btn-primary">
          Add Player
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Players
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Win Rate %
              </label>
              <input
                type="number"
                value={filters.winningPercentage_min || ''}
                onChange={(e) => handleFilterChange('winningPercentage_min', e.target.value)}
                placeholder="0-100"
                min="0"
                max="100"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Win Rate %
              </label>
              <input
                type="number"
                value={filters.winningPercentage_max || ''}
                onChange={(e) => handleFilterChange('winningPercentage_max', e.target.value)}
                placeholder="0-100"
                min="0"
                max="100"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="select"
              >
                <option value="name">Name (A-Z)</option>
                <option value="-name">Name (Z-A)</option>
                <option value="-winningPercentage">Win Rate (High to Low)</option>
                <option value="winningPercentage">Win Rate (Low to High)</option>
                <option value="-gamesPlayed">Games Played (Most to Least)</option>
                <option value="gamesPlayed">Games Played (Least to Most)</option>
                <option value="-totalChampionships">Championships (Most to Least)</option>
                <option value="totalChampionships">Championships (Least to Most)</option>
                <option value="-bodsPlayed">BODs Played (Most to Least)</option>
                <option value="bodsPlayed">BODs Played (Least to Most)</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Apply Filters
          </button>
        </form>
      </Card>

      {/* Players List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-500">Loading players...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 font-medium mb-2">Error loading players</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : (players && 'data' in players && Array.isArray(players.data) && players.data.length > 0) ? (
          <div className="grid grid-cols-1 gap-4">
            {(players.data as any[]).map((player: any) => (
              <div key={player.id || player._id} className="group">
                <Card variant="hover" padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-lg">
                          {player.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {player.name || 'Unknown Player'}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            BODs: {player.bodsPlayed || 0}
                          </span>
                          <span className="text-sm text-gray-600">
                            Avg: {player.avgFinish ? player.avgFinish.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {((player.winningPercentage || 0) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Win Rate</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {player.gamesPlayed || 0}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Games</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {player.totalChampionships || 0}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Championships</p>
                      </div>
                      
                      <Link
                        to={`/players/${player.id || player._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">👥</span>
            </div>
            <p className="text-gray-500 mb-4">No players found</p>
            <Link to="/players/create" className="btn btn-primary">
              Add Your First Player
            </Link>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {players && 'pagination' in players && (players as any).pagination && (players as any).pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {page} of {players && 'pagination' in players && (players as any).pagination ? (players as any).pagination.pages : 1}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={players && 'pagination' in players ? page === (players as any).pagination.pages : true}
            className="btn btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Players;