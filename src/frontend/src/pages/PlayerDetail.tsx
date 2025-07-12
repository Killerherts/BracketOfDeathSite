import React, { useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import apiClient from '../services/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatCard from '../components/ui/StatCard';

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getPlayer = useCallback(
    () => apiClient.getPlayer(id!),
    [id]
  );

  const { data: playerResponse, loading, error } = useApi(
    getPlayer,
    { immediate: true }
  );

  const getPlayerResults = useCallback(
    () => apiClient.getResultsByPlayer(id!),
    [id]
  );

  const { data: resultsResponse, loading: resultsLoading } = useApi(
    getPlayerResults,
    { immediate: true }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-500">Loading player details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Player not found</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/players" className="btn btn-primary">
          Back to Players
        </Link>
      </div>
    );
  }

  const player = playerResponse as any;
  const resultsData = resultsResponse as any;
  const results = resultsData?.results || [];
  const playerStats = resultsData?.stats;

  if (!player) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">👤</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Player not found</h2>
        <p className="text-gray-600 mb-4">The requested player could not be found.</p>
        <Link to="/players" className="btn btn-primary">
          Back to Players
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">
              {player.name?.split(' ').map(n => n[0]).join('') || 'P'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
            <p className="text-gray-600">
              {player.pairing ? `Partners with ${player.pairing}` : 'Individual Player'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/players/${id}/edit`)}
            className="btn btn-outline"
          >
            Edit Player
          </button>
          <button
            onClick={() => navigate('/players')}
            className="btn btn-secondary"
          >
            Back to Players
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="BODs Played"
          value={player.bodsPlayed || 0}
          icon="🏆"
          iconColor="bg-blue-100 text-blue-600"
        />
        
        <StatCard
          title="Best Result"
          value={player.bestResult || 0}
          icon="🥇"
          iconColor="bg-yellow-100 text-yellow-600"
        />
        
        <StatCard
          title="Win Rate"
          value={`${((player.winningPercentage || 0) * 100).toFixed(1)}%`}
          icon="📊"
          iconColor="bg-green-100 text-green-600"
        />
        
        <StatCard
          title="Championships"
          value={player.totalChampionships || 0}
          icon="🏅"
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tournament Performance */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Finish</span>
              <span className="font-medium">{player.avgFinish?.toFixed(1) || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">BODs Played</span>
              <span className="font-medium">{player.bodsPlayed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Best Result</span>
              <span className="font-medium">{player.bestResult || 0}</span>
            </div>
          </div>
        </Card>

        {/* Game Statistics */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Games Played</span>
              <span className="font-medium">{playerStats?.totalGames || player.gamesPlayed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Games Won</span>
              <span className="font-medium">{playerStats?.totalWins || player.gamesWon || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Games Lost</span>
              <span className="font-medium">{playerStats?.totalLosses || (player.gamesPlayed - player.gamesWon) || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Winning Percentage</span>
              <span className="font-medium">{((playerStats?.overallWinPercentage || player.winningPercentage || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Championships */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Championships</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {player.individualChampionships || 0}
            </div>
            <div className="text-sm text-gray-600">Individual Championships</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {player.divisionChampionships || 0}
            </div>
            <div className="text-sm text-gray-600">Division Championships</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {player.totalChampionships || 0}
            </div>
            <div className="text-sm text-gray-600">Total Championships</div>
          </div>
        </div>
      </Card>

      {/* Recent Results */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Tournament Results</h3>
          <Link to={`/results?playerId=${id}`} className="btn btn-outline btn-sm">
            View All Results
          </Link>
        </div>
        
        {resultsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-2 text-gray-500">Loading results...</span>
          </div>
        ) : Array.isArray(results) && results.length > 0 ? (
          <div className="space-y-3">
            {results.slice(0, 5).map((result: any) => (
              <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    result.totalStats?.bodFinish === 1 ? 'bg-yellow-100 text-yellow-800' :
                    result.totalStats?.bodFinish === 2 ? 'bg-gray-100 text-gray-800' :
                    result.totalStats?.bodFinish === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {result.totalStats?.bodFinish || 0}
                  </div>
                  <div>
                    <Link 
                      to={`/tournaments/${result.tournamentId?.id || result.tournamentId?._id || result.tournamentId}`}
                      className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      BOD #{result.tournamentId?.bodNumber || 'N/A'} - {result.tournamentId?.location || 'Unknown Location'}
                    </Link>
                    <div className="text-sm text-gray-600">
                      {result.tournamentId?.date ? new Date(result.tournamentId.date).toLocaleDateString() : 'Date unknown'}
                    </div>
                    {result.teamName && (
                      <div className="text-sm text-gray-500">
                        Team: {result.teamName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {result.totalStats?.totalWon || 0}-{result.totalStats?.totalLost || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.totalStats?.totalPlayed > 0 ? 
                      `${((result.totalStats?.totalWon / result.totalStats?.totalPlayed) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </div>
                  {result.performanceGrade && (
                    <div className="text-xs text-gray-500">
                      Grade: {result.performanceGrade}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-xl">📊</span>
            </div>
            <p className="text-gray-500">No tournament results found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlayerDetail;