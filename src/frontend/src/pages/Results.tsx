import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import apiClient from '../services/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Results: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    tournamentId: '',
    playerId: '',
    division: '',
    year: '',
    sort: '-tournament.date',
  });

  const getTournamentResults = useCallback(
    () => apiClient.getTournamentResults({ 
      page, 
      limit: 20, 
      ...filters 
    }),
    [page, filters]
  );

  const { data: results, loading, error } = useApi(
    getTournamentResults,
    { 
      immediate: true,
      dependencies: [page, filters]
    }
  );

  const getTournaments = useCallback(
    () => apiClient.getTournaments({ limit: 100 }),
    []
  );

  const { data: tournaments } = useApi(
    getTournaments,
    { immediate: true }
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlacementColor = (placement: number) => {
    switch (placement) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPlacementIcon = (placement: number) => {
    switch (placement) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tournament Results</h1>
          <p className="text-gray-600">View player performance and tournament outcomes</p>
        </div>
        <Link to="/tournaments" className="btn btn-primary">
          View Tournaments
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament
            </label>
            <select
              value={filters.tournamentId}
              onChange={(e) => handleFilterChange('tournamentId', e.target.value)}
              className="input"
            >
              <option value="">All Tournaments</option>
              {tournaments && 'data' in tournaments && Array.isArray(tournaments.data) ? tournaments.data.map((tournament: any) => (
                <option key={tournament.id} value={tournament.id}>
                  BOD #{tournament.bodNumber} - {tournament.location}
                </option>
              )) : null}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="input"
            >
              <option value="">All Years</option>
              {Array.from({ length: 16 }, (_, i) => 2024 - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Division
            </label>
            <input
              type="text"
              value={filters.division}
              onChange={(e) => handleFilterChange('division', e.target.value)}
              placeholder="Filter by division..."
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
              className="input"
            >
              <option value="-tournament.date">Date (Newest First)</option>
              <option value="tournament.date">Date (Oldest First)</option>
              <option value="totalStats.bodFinish">Best Finish First</option>
              <option value="-totalStats.bodFinish">Worst Finish First</option>
              <option value="-totalStats.winPercentage">Win % (High to Low)</option>
              <option value="totalStats.winPercentage">Win % (Low to High)</option>
              <option value="-totalStats.totalWon">Most Games Won</option>
              <option value="tournament.bodNumber">BOD Number</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Results List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-500">Loading results...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 font-medium mb-2">Error loading results</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : (results && 'data' in results && Array.isArray(results.data) && results.data.length > 0) ? (
          <div className="space-y-4">
            {results.data.map((result: any) => (
              <div key={result.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center border-2 ${getPlacementColor(result.totalStats?.bodFinish || 0)}`}>
                      <span className="text-2xl">
                        {getPlacementIcon(result.totalStats?.bodFinish || 0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {result.teamName || 'Team'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlacementColor(result.totalStats?.bodFinish || 0)}`}>
                          {result.totalStats?.bodFinish === 1 ? 'Champion' : 
                           result.totalStats?.bodFinish === 2 ? 'Runner-up' : 
                           result.totalStats?.bodFinish === 3 ? 'Third Place' : 
                           `${result.totalStats?.bodFinish || 0}th Place`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Tournament: BOD #{result.tournament?.bodNumber} - {result.tournament?.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(result.tournament?.date || result.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {result.totalStats?.totalWon || 0}
                      </p>
                      <p className="text-xs text-gray-500">Games Won</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {result.totalStats?.totalPlayed || 0}
                      </p>
                      <p className="text-xs text-gray-500">Games Played</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {result.totalStats?.totalPlayed > 0 ? 
                          ((result.totalStats?.totalWon / result.totalStats?.totalPlayed) * 100).toFixed(1) + '%' : 
                          '0%'
                        }
                      </p>
                      <p className="text-xs text-gray-500">Win Rate</p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Link
                        to={`/tournaments/${result.tournamentId || result.tournament?.id || result.tournament?._id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Tournament →
                      </Link>
                      <div className="text-sm text-gray-600">
                        {result.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📊</span>
            </div>
            <p className="text-gray-500 mb-4">No results found</p>
            <Link to="/tournaments" className="btn btn-primary">
              View Tournaments
            </Link>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      {results && 'data' in results && Array.isArray(results.data) && results.data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {results.data.filter((r: any) => r.totalStats?.bodFinish === 1).length}
              </div>
              <div className="text-sm text-gray-600">Championships</div>
              <div className="text-xs text-gray-400 mt-1">
                {(results as any).pagination?.total ? `${((results.data.filter((r: any) => r.totalStats?.bodFinish === 1).length / (results as any).pagination.total) * 100).toFixed(1)}%` : '0%'} of results
              </div>
            </div>
          </Card>
          
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {results.data.filter((r: any) => r.totalStats?.bodFinish === 2).length}
              </div>
              <div className="text-sm text-gray-600">Runner-ups</div>
              <div className="text-xs text-gray-400 mt-1">
                {(results as any).pagination?.total ? `${((results.data.filter((r: any) => r.totalStats?.bodFinish === 2).length / (results as any).pagination.total) * 100).toFixed(1)}%` : '0%'} of results
              </div>
            </div>
          </Card>
          
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {results.data.filter((r: any) => r.totalStats?.bodFinish === 3).length}
              </div>
              <div className="text-sm text-gray-600">Third Places</div>
              <div className="text-xs text-gray-400 mt-1">
                {(results as any).pagination?.total ? `${((results.data.filter((r: any) => r.totalStats?.bodFinish === 3).length / (results as any).pagination.total) * 100).toFixed(1)}%` : '0%'} of results
              </div>
            </div>
          </Card>
          
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {results.data.reduce((sum: number, r: any) => sum + (r.totalStats?.totalWon || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Games Won</div>
              <div className="text-xs text-gray-400 mt-1">
                Across {results.data.length} team results
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pagination */}
      {results && 'pagination' in results && (results as any).pagination && (results as any).pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {page} of {results && 'pagination' in results && (results as any).pagination ? (results as any).pagination.pages : 1}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={results && 'pagination' in results ? page === (results as any).pagination.pages : true}
            className="btn btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Results;