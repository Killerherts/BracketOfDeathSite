import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { TournamentResult } from '../models/TournamentResult';
import { Tournament } from '../models/Tournament';
import { Player } from '../models/Player';
import { ITournamentResult, ITournamentResultInput, ITournamentResultFilter } from '../types/tournamentResult';
import { BaseController, RequestWithAuth } from './base';
import { ApiResponse } from '../types/common';

export class TournamentResultController extends BaseController<ITournamentResult> {
  constructor() {
    super(TournamentResult, 'TournamentResult');
  }

  // Override buildFilter for tournament result-specific filtering
  protected override buildFilter(query: any): ITournamentResultFilter {
    const filter: ITournamentResultFilter = {};
    const { page, limit, sort, select, populate, q, year, ...filterParams } = query;

    // Tournament ID filtering
    if (filterParams.tournamentId) {
      filter.tournamentId = new Types.ObjectId(filterParams.tournamentId);
    }

    // Player filtering
    if (filterParams.playerId) {
      filter.players = { $in: [new Types.ObjectId(filterParams.playerId)] };
    }
    if (filterParams.playerIds) {
      const playerIds = Array.isArray(filterParams.playerIds) 
        ? filterParams.playerIds 
        : filterParams.playerIds.split(',');
      filter.players = { $in: playerIds.map((id: string) => new Types.ObjectId(id)) };
    }

    // Division filtering
    if (filterParams.division) {
      filter.division = new RegExp(filterParams.division, 'i');
    }

    // Seed filtering
    if (filterParams.seed) {
      filter.seed = parseInt(filterParams.seed);
    } else if (filterParams.seed_min || filterParams.seed_max) {
      filter.seed = {};
      if (filterParams.seed_min) {
        (filter.seed as any).$gte = parseInt(filterParams.seed_min);
      }
      if (filterParams.seed_max) {
        (filter.seed as any).$lte = parseInt(filterParams.seed_max);
      }
    }

    // Final rank filtering
    if (filterParams.finalRank) {
      filter['totalStats.finalRank'] = parseInt(filterParams.finalRank);
    } else if (filterParams.finalRank_min || filterParams.finalRank_max) {
      filter['totalStats.finalRank'] = {};
      if (filterParams.finalRank_min) {
        (filter['totalStats.finalRank'] as any).$gte = parseInt(filterParams.finalRank_min);
      }
      if (filterParams.finalRank_max) {
        (filter['totalStats.finalRank'] as any).$lte = parseInt(filterParams.finalRank_max);
      }
    }

    // BOD finish filtering
    if (filterParams.bodFinish) {
      filter['totalStats.bodFinish'] = parseInt(filterParams.bodFinish);
    } else if (filterParams.bodFinish_min || filterParams.bodFinish_max) {
      filter['totalStats.bodFinish'] = {};
      if (filterParams.bodFinish_min) {
        (filter['totalStats.bodFinish'] as any).$gte = parseInt(filterParams.bodFinish_min);
      }
      if (filterParams.bodFinish_max) {
        (filter['totalStats.bodFinish'] as any).$lte = parseInt(filterParams.bodFinish_max);
      }
    }

    // Win percentage filtering
    if (filterParams.winPercentage_min || filterParams.winPercentage_max) {
      filter['totalStats.winPercentage'] = {};
      if (filterParams.winPercentage_min) {
        (filter['totalStats.winPercentage'] as any).$gte = parseFloat(filterParams.winPercentage_min);
      }
      if (filterParams.winPercentage_max) {
        (filter['totalStats.winPercentage'] as any).$lte = parseFloat(filterParams.winPercentage_max);
      }
    }

    return filter;
  }

  // Override getAll to include default population
  override getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sort: (req.query.sort as string) || '-tournament.date',
        select: req.query.select as string,
      };

      const filter = this.buildFilter(req.query);
      const year = req.query.year as string;

      // Use aggregation for better performance with populated data
      const pipeline: any[] = [
        { $match: filter },
        {
          $lookup: {
            from: 'players',
            localField: 'players',
            foreignField: '_id',
            as: 'playerDetails',
          },
        },
        {
          $lookup: {
            from: 'tournaments',
            localField: 'tournamentId',
            foreignField: '_id',
            as: 'tournamentDetails',
          },
        },
        {
          $addFields: {
            tournament: { $arrayElemAt: ['$tournamentDetails', 0] },
            teamName: {
              $reduce: {
                input: '$playerDetails',
                initialValue: '',
                in: {
                  $cond: {
                    if: { $eq: ['$$value', ''] },
                    then: '$$this.name',
                    else: { $concat: ['$$value', ' & ', '$$this.name'] },
                  },
                },
              },
            },
          },
        },
      ];

      // Add year filtering after lookup if specified
      if (year) {
        const yearInt = parseInt(year);
        pipeline.push({
          $match: {
            'tournament.date': {
              $gte: new Date(`${yearInt}-01-01`),
              $lte: new Date(`${yearInt}-12-31`),
            },
          },
        });
      }

      pipeline.push(
        {
          $project: {
            tournamentDetails: 0,
            playerDetails: 0,
          },
        },
        { $sort: this.parseSortString(options.sort) },
        { $skip: (options.page - 1) * options.limit },
        { $limit: options.limit }
      );

      // Create count pipeline for accurate total with year filtering
      const countPipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'tournaments',
            localField: 'tournamentId',
            foreignField: '_id',
            as: 'tournament',
          },
        },
        {
          $addFields: {
            tournament: { $arrayElemAt: ['$tournament', 0] },
          },
        },
      ];

      if (year) {
        const yearInt = parseInt(year);
        countPipeline.push({
          $match: {
            'tournament.date': {
              $gte: new Date(`${yearInt}-01-01`),
              $lte: new Date(`${yearInt}-12-31`),
            },
          },
        });
      }

      countPipeline.push({ $count: 'total' } as any);

      const [results, totalResult] = await Promise.all([
        TournamentResult.aggregate(pipeline),
        TournamentResult.aggregate(countPipeline),
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      const pages = Math.ceil(total / options.limit);

      const response = {
        success: true,
        data: results,
        pagination: {
          current: options.page,
          pages,
          count: results.length,
          total,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get results by tournament
  getByTournament = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tournamentId } = req.params;

      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        this.sendError(res, 404, 'Tournament not found');
        return;
      }

      const results = await TournamentResult.find({ tournamentId })
        .populate('players', 'name')
        .sort({ 'totalStats.finalRank': 1, 'totalStats.winPercentage': -1 });

      const response: ApiResponse = {
        success: true,
        data: {
          tournament,
          results,
          resultCount: results.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get results by player
  getByPlayer = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { playerId } = req.params;

      const player = await Player.findById(playerId);
      if (!player) {
        this.sendError(res, 404, 'Player not found');
        return;
      }

      const results = await TournamentResult.find({ 
        players: { $in: [playerId] } 
      })
        .populate('tournamentId')
        .populate('players', 'name')
        .sort({ 'tournament.date': -1 });

      // Calculate player statistics across all tournaments
      const stats = this.calculatePlayerStats(results);

      const response: ApiResponse = {
        success: true,
        data: {
          player,
          results,
          stats,
          resultCount: results.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get leaderboard/rankings
  getLeaderboard = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tournamentId, format, year } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;

      let matchStage: any = {};

      // Filter by tournament
      if (tournamentId) {
        matchStage.tournamentId = new Types.ObjectId(tournamentId as string);
      }

      // Build aggregation pipeline
      const pipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'tournaments',
            localField: 'tournamentId',
            foreignField: '_id',
            as: 'tournament',
          },
        },
        {
          $unwind: '$tournament',
        },
      ];

      // Add format filtering if specified
      if (format) {
        pipeline.push({
          $match: { 'tournament.format': format },
        });
      }

      // Add year filtering if specified
      if (year) {
        const yearInt = parseInt(year as string);
        pipeline.push({
          $match: {
            'tournament.date': {
              $gte: new Date(`${yearInt}-01-01`),
              $lte: new Date(`${yearInt}-12-31`),
            },
          },
        });
      }

      // Group by players and calculate aggregate stats
      pipeline.push(
        {
          $group: {
            _id: '$players',
            totalTournaments: { $sum: 1 },
            totalWins: { $sum: '$totalStats.totalWon' },
            totalLosses: { $sum: '$totalStats.totalLost' },
            totalGames: { $sum: '$totalStats.totalPlayed' },
            avgWinPercentage: { $avg: '$totalStats.winPercentage' },
            bestFinish: { $min: '$totalStats.finalRank' },
            avgFinish: { $avg: '$totalStats.finalRank' },
            championships: {
              $sum: {
                $cond: [{ $eq: ['$totalStats.finalRank', 1] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'players',
            localField: '_id',
            foreignField: '_id',
            as: 'playerDetails',
          },
        },
        {
          $addFields: {
            overallWinPercentage: {
              $cond: [
                { $gt: ['$totalGames', 0] },
                { $divide: ['$totalWins', '$totalGames'] },
                0,
              ],
            },
            teamName: {
              $reduce: {
                input: '$playerDetails',
                initialValue: '',
                in: {
                  $cond: {
                    if: { $eq: ['$$value', ''] },
                    then: '$$this.name',
                    else: { $concat: ['$$value', ' & ', '$$this.name'] },
                  },
                },
              },
            },
          },
        },
        {
          $sort: {
            championships: -1,
            overallWinPercentage: -1,
            avgFinish: 1,
          },
        },
        { $limit: limit }
      );

      const leaderboard = await TournamentResult.aggregate(pipeline);

      const response: ApiResponse = {
        success: true,
        data: leaderboard,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get tournament result statistics
  getStats = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await TournamentResult.aggregate([
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            avgWinPercentage: { $avg: '$totalStats.winPercentage' },
            avgGamesPlayed: { $avg: '$totalStats.totalPlayed' },
            highestWinPercentage: { $max: '$totalStats.winPercentage' },
            lowestWinPercentage: { $min: '$totalStats.winPercentage' },
          },
        },
      ]);

      const performanceDistribution = await TournamentResult.aggregate([
        {
          $bucket: {
            groupBy: '$totalStats.winPercentage',
            boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              avgRank: { $avg: '$totalStats.finalRank' },
            },
          },
        },
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          overview: stats[0] || {},
          performanceDistribution,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Bulk import tournament results (for data migration)
  bulkImport = this.asyncHandler(async (req: RequestWithAuth, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { results } = req.body;

      if (!Array.isArray(results) || results.length === 0) {
        this.sendError(res, 400, 'Results array is required');
        return;
      }

      const importResults = {
        created: 0,
        updated: 0,
        errors: [] as Array<{ tournament: string; players: string[]; error: string }>,
      };

      for (const resultData of results) {
        try {
          // Validate tournament exists
          const tournament = await Tournament.findById(resultData.tournamentId);
          if (!tournament) {
            importResults.errors.push({
              tournament: resultData.tournamentId,
              players: resultData.players || [],
              error: 'Tournament not found',
            });
            continue;
          }

          // Validate players exist
          const playerIds = Array.isArray(resultData.players) ? resultData.players : [resultData.players];
          const players = await Player.find({ _id: { $in: playerIds } });
          if (players.length !== playerIds.length) {
            importResults.errors.push({
              tournament: resultData.tournamentId,
              players: playerIds,
              error: 'One or more players not found',
            });
            continue;
          }

          // Check if result already exists
          const existingResult = await TournamentResult.findOne({
            tournamentId: resultData.tournamentId,
            players: { $all: playerIds },
          });

          if (existingResult) {
            await TournamentResult.findByIdAndUpdateSafe(existingResult._id.toString(), resultData);
            importResults.updated++;
          } else {
            await TournamentResult.create(resultData);
            importResults.created++;
          }
        } catch (error: any) {
          importResults.errors.push({
            tournament: resultData.tournamentId || 'Unknown',
            players: resultData.players || [],
            error: error.message,
          });
        }
      }

      const response: ApiResponse = {
        success: true,
        data: importResults,
        message: `Bulk import completed: ${importResults.created} created, ${importResults.updated} updated, ${importResults.errors.length} errors`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Helper method to parse sort string
  private parseSortString(sortStr: string): any {
    const sort: any = {};
    const parts = sortStr.split(',');
    
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith('-')) {
        const field = trimmed.substring(1);
        // Handle nested field references
        sort[field] = -1;
      } else {
        sort[trimmed] = 1;
      }
    });

    return sort;
  }

  // Helper method to calculate player statistics
  private calculatePlayerStats(results: ITournamentResult[]): any {
    if (results.length === 0) {
      return {
        totalTournaments: 0,
        totalWins: 0,
        totalLosses: 0,
        totalGames: 0,
        overallWinPercentage: 0,
        avgFinish: 0,
        bestFinish: null,
        championships: 0,
      };
    }

    const totalWins = results.reduce((sum, result) => sum + result.totalStats.totalWon, 0);
    const totalLosses = results.reduce((sum, result) => sum + result.totalStats.totalLost, 0);
    const totalGames = results.reduce((sum, result) => sum + result.totalStats.totalPlayed, 0);
    const validRanks = results.filter(r => r.totalStats.finalRank).map(r => r.totalStats.finalRank!);
    const championships = results.filter(r => r.totalStats.finalRank === 1).length;

    return {
      totalTournaments: results.length,
      totalWins,
      totalLosses,
      totalGames,
      overallWinPercentage: totalGames > 0 ? totalWins / totalGames : 0,
      avgFinish: validRanks.length > 0 ? validRanks.reduce((a, b) => a + b, 0) / validRanks.length : 0,
      bestFinish: validRanks.length > 0 ? Math.min(...validRanks) : null,
      championships,
    };
  }

  // Validate tournament result data
  private validateTournamentResultData(data: ITournamentResultInput): string[] {
    const errors: string[] = [];

    // Validate total stats consistency
    const stats = data.totalStats;
    if (stats) {
      if (stats.totalWon + stats.totalLost !== stats.totalPlayed) {
        errors.push('Total games played must equal total won plus total lost');
      }

      if (stats.totalWon > stats.totalPlayed) {
        errors.push('Total games won cannot exceed total games played');
      }

      if (stats.totalLost > stats.totalPlayed) {
        errors.push('Total games lost cannot exceed total games played');
      }

      if (stats.winPercentage < 0 || stats.winPercentage > 1) {
        errors.push('Win percentage must be between 0 and 1');
      }
    }

    // Validate player count
    if (data.players && (data.players.length < 1 || data.players.length > 2)) {
      errors.push('A team must have 1 or 2 players');
    }

    return errors;
  }

  // Override create method to add custom validation
  override async create(req: RequestWithAuth, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationErrors = this.validateTournamentResultData(req.body);
      
      if (validationErrors.length > 0) {
        this.sendError(res, 400, validationErrors.join(', '));
        return;
      }

      // Call parent create method
      await super.create(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  // Override update method to add custom validation
  override async update(req: RequestWithAuth, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationErrors = this.validateTournamentResultData(req.body);
      
      if (validationErrors.length > 0) {
        this.sendError(res, 400, validationErrors.join(', '));
        return;
      }

      // Call parent update method
      await super.update(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

export const tournamentResultController = new TournamentResultController();