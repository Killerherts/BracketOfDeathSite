import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import apiClient from '../services/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'bracket'>('overview');

  // Set initial tab based on URL
  useEffect(() => {
    if (location.pathname.includes('/bracket')) {
      setActiveTab('bracket');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  const getTournament = useCallback(
    () => apiClient.getTournament(id!),
    [id]
  );

  const { data: tournament, loading: tournamentLoading, error: tournamentError } = useApi(
    getTournament,
    { immediate: true }
  );

  const getResults = useCallback(
    () => apiClient.getResultsByTournament(id!),
    [id]
  );

  const { data: results, loading: resultsLoading } = useApi(
    getResults,
    { immediate: true }
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFormatDisplayName = (format: string) => {
    switch (format) {
      case 'M': return "Men's";
      case 'W': return "Women's";
      case 'Mixed': return "Mixed";
      default: return format;
    }
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case 'M': return 'bg-blue-100 text-blue-800';
      case 'W': return 'bg-pink-100 text-pink-800';
      case 'Mixed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (tournamentLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-500">Loading tournament...</span>
      </div>
    );
  }

  if (tournamentError) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error loading tournament</h2>
        <p className="text-gray-600 mb-4">{tournamentError}</p>
        <Link to="/tournaments" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  if (!tournament || !('data' in tournament)) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">🏆</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Tournament not found</h2>
        <p className="text-gray-600 mb-4">The requested tournament could not be found.</p>
        <Link to="/tournaments" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  const tournamentData = (tournament as any).data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/tournaments" className="text-gray-500 hover:text-gray-700">
            ← Back to Tournaments
          </Link>
          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
            <span className="text-primary-600 font-bold text-lg">
              #{tournamentData.bodNumber}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {getFormatDisplayName(tournamentData.format)} Tournament
              </h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFormatBadgeColor(tournamentData.format)}`}>
                {getFormatDisplayName(tournamentData.format)}
              </span>
            </div>
            <p className="text-gray-600">
              {tournamentData.location} • {formatDate(tournamentData.date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">BOD Number</p>
          <p className="text-lg font-bold text-primary-600">#{tournamentData.bodNumber}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'results', label: 'Results' },
            { key: 'bracket', label: 'Bracket' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(tournamentData.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Format</p>
                  <p className="font-medium">{getFormatDisplayName(tournamentData.format)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{tournamentData.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">BOD Number</p>
                  <p className="font-medium">#{tournamentData.bodNumber}</p>
                </div>
              </div>
              {tournamentData.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{tournamentData.notes}</p>
                </div>
              )}
              <div className="mt-4">
                <p className="text-sm text-gray-500">Advancement Criteria</p>
                <p className="font-medium">{tournamentData.advancementCriteria}</p>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Teams</span>
                  <span className="font-medium">
                    {results && 'data' in (results as any) && Array.isArray((results as any).data) ? (results as any).data.length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Season</span>
                  <span className="font-medium">{tournamentData.season || 'N/A'}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setActiveTab('results')}
                  className="w-full btn btn-primary"
                >
                  View Results
                </button>
                <button 
                  onClick={() => setActiveTab('bracket')}
                  className="w-full btn btn-secondary"
                >
                  View Bracket
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Results</h3>
          {resultsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-gray-500">Loading results...</span>
            </div>
          ) : results && 'data' in (results as any) && Array.isArray((results as any).data) && (results as any).data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">Rank</th>
                    <th className="table-header">Team</th>
                    <th className="table-header">Division</th>
                    <th className="table-header">Games Won</th>
                    <th className="table-header">Games Lost</th>
                    <th className="table-header">Win %</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {((results as any).data as any[]).sort((a, b) => (a.totalStats?.bodFinish || 999) - (b.totalStats?.bodFinish || 999)).map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className="font-medium">#{result.totalStats?.bodFinish || 'N/A'}</span>
                          {result.totalStats?.bodFinish === 1 && <span className="ml-1">🏆</span>}
                          {result.totalStats?.bodFinish === 2 && <span className="ml-1">🥈</span>}
                          {result.totalStats?.bodFinish === 3 && <span className="ml-1">🥉</span>}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium">{result.teamName || 'Team'}</div>
                      </td>
                      <td className="table-cell">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {result.division || 'N/A'}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-green-600">
                        {result.totalStats?.totalWon || 0}
                      </td>
                      <td className="table-cell font-medium text-red-600">
                        {result.totalStats?.totalLost || 0}
                      </td>
                      <td className="table-cell font-medium">
                        {result.totalStats?.totalPlayed > 0 ? 
                          ((result.totalStats?.totalWon / result.totalStats?.totalPlayed) * 100).toFixed(1) + '%' : 
                          '0%'
                        }
                      </td>
                      <td className="table-cell">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found for this tournament</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'bracket' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Bracket</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Bracket visualization coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              This feature will display the tournament bracket with match results
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TournamentDetail;