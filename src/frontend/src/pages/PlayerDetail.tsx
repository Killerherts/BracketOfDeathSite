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

      {/* Tournaments List */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Tournament History</h3>
        {resultsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-2 text-gray-500">Loading tournament history...</span>
          </div>
        ) : Array.isArray(results) && results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result: any) => {
              const partner = result.players?.find((p: any) => p._id !== id);
              const tournament = result.tournamentId;

              const getRankIndicatorClass = (rank: number) => {
                switch (rank) {
                  case 1: return 'border-l-4 border-yellow-400';
                  case 2: return 'border-l-4 border-gray-400';
                  case 3: return 'border-l-4 border-orange-500';
                  default: return 'border-l-4 border-transparent';
                }
              };

              return (
                <Link
                  key={result.id}
                  to={`/tournaments/${tournament?.id || tournament?._id}`}
                  className={`block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all ${getRankIndicatorClass(result.totalStats?.finalRank)}`}
                >
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Left Column: Tournament Info */}
                    <div className="col-span-2">
                      <p className="font-medium text-gray-900 hover:text-primary-600 transition-colors">
                        {tournament.name}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1 mt-1">
                        <p>
                          <span className="font-semibold">Date:</span> {new Date(tournament.date).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-semibold">Location:</span> {tournament.location}
                        </p>
                        <p>
                          <span className="font-semibold">Format:</span> {tournament.format}
                        </p>
                        {partner && (
                          <p>
                            <span className="font-semibold">Partner:</span> {partner.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Performance Stats */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-800">
                        Rank: {result.totalStats?.finalRank || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        (Seed: {result.seed || 'N/A'})
                      </p>
                      <div className="mt-2">
                        <p className="font-medium text-gray-700">
                          {result.totalStats?.totalWon || 0}W - {result.totalStats?.totalLost || 0}L
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.totalStats.winPercentage != null 
                            ? `${(result.totalStats.winPercentage * 100).toFixed(0)}% Win Rate` 
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-xl">🏆</span>
            </div>
            <p className="text-gray-500">No tournament history found for this player.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlayerDetail;