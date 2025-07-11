import { Request, Response, NextFunction } from 'express';
import { Tournament } from '../models/Tournament';
import { TournamentResult } from '../models/TournamentResult';
import { ITournament, ITournamentInput, ITournamentFilter, TournamentFormats } from '../types/tournament';
import { BaseController, RequestWithAuth } from './base';
import { ApiResponse } from '../types/common';

export class TournamentController extends BaseController<ITournament> {
  constructor() {
    super(Tournament, 'Tournament');
  }

  // Override buildFilter for tournament-specific filtering
  protected override buildFilter(query: any): ITournamentFilter {
    const filter: ITournamentFilter = {};
    const { page, limit, sort, select, populate, q, ...filterParams } = query;

    // Date range filtering
    if (filterParams.startDate || filterParams.endDate) {
      filter.date = {};
      if (filterParams.startDate) {
        filter.date.$gte = new Date(filterParams.startDate);
      }
      if (filterParams.endDate) {
        filter.date.$lte = new Date(filterParams.endDate);
      }
    } else if (filterParams.date) {
      (filter as any).date = new Date(filterParams.date);
    }

    // Year filtering
    if (filterParams.year) {
      const year = parseInt(filterParams.year);
      filter.date = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      };
    }

    // BOD number filtering
    if (filterParams.bodNumber) {
      filter.bodNumber = parseInt(filterParams.bodNumber);
    } else if (filterParams.bodNumber_min || filterParams.bodNumber_max) {
      filter.bodNumber = {};
      if (filterParams.bodNumber_min) {
        (filter.bodNumber as any).$gte = parseInt(filterParams.bodNumber_min);
      }
      if (filterParams.bodNumber_max) {
        (filter.bodNumber as any).$lte = parseInt(filterParams.bodNumber_max);
      }
    }

    // Format filtering
    if (filterParams.format) {
      filter.format = filterParams.format;
    }

    // Location search (case insensitive)
    if (filterParams.location) {
      filter.location = new RegExp(filterParams.location, 'i');
    }

    // Advancement criteria search
    if (filterParams.advancementCriteria) {
      filter.advancementCriteria = new RegExp(filterParams.advancementCriteria, 'i');
    }

    return filter;
  }

  // Override buildSearchFilter for tournament-specific search
  protected override buildSearchFilter(searchTerm: string): any {
    return {
      $or: [
        { location: new RegExp(searchTerm, 'i') },
        { notes: new RegExp(searchTerm, 'i') },
        { advancementCriteria: new RegExp(searchTerm, 'i') },
      ],
    };
  }

  // Get tournament statistics
  getStats = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await Tournament.aggregate([
        {
          $group: {
            _id: null,
            totalTournaments: { $sum: 1 },
            formats: { $addToSet: '$format' },
            locations: { $addToSet: '$location' },
            earliestDate: { $min: '$date' },
            latestDate: { $max: '$date' },
          },
        },
      ]);

      const formatStats = await Tournament.aggregate([
        {
          $group: {
            _id: '$format',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const yearlyStats = await Tournament.aggregate([
        {
          $group: {
            _id: { $year: '$date' },
            count: { $sum: 1 },
            formats: { $addToSet: '$format' },
          },
        },
        {
          $sort: { _id: -1 },
        },
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          overview: stats[0] || {},
          formatBreakdown: formatStats,
          yearlyBreakdown: yearlyStats,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get tournaments by year
  getByYear = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { year } = req.params;
      const yearInt = parseInt(year);

      if (isNaN(yearInt) || yearInt < 2009 || yearInt > new Date().getFullYear() + 10) {
        this.sendError(res, 400, 'Invalid year provided');
        return;
      }

      const tournaments = await Tournament.find({
        date: {
          $gte: new Date(`${yearInt}-01-01`),
          $lte: new Date(`${yearInt}-12-31`),
        },
      }).sort({ date: 1 });

      const response: ApiResponse = {
        success: true,
        data: tournaments,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get tournaments by format
  getByFormat = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { format } = req.params;

      if (!TournamentFormats.includes(format as any)) {
        this.sendError(res, 400, `Invalid format. Must be one of: ${TournamentFormats.join(', ')}`);
        return;
      }

      const tournaments = await Tournament.find({ format }).sort({ date: -1 });

      const response: ApiResponse = {
        success: true,
        data: tournaments,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get tournament with results
  getWithResults = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const tournament = await Tournament.findById(id);
      if (!tournament) {
        this.sendError(res, 404, 'Tournament not found');
        return;
      }

      const results = await TournamentResult.find({ tournamentId: id })
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

  // Get upcoming tournaments
  getUpcoming = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const limit = parseInt(req.query.limit as string) || 10;

      const upcomingTournaments = await Tournament.find({
        date: { $gte: now },
      })
        .sort({ date: 1 })
        .limit(limit);

      const response: ApiResponse = {
        success: true,
        data: upcomingTournaments,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get recent tournaments
  getRecent = this.asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const recentTournaments = await Tournament.find({})
        .sort({ date: -1 })
        .limit(limit);

      const response: ApiResponse = {
        success: true,
        data: recentTournaments,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Bulk import tournaments (for data migration)
  bulkImport = this.asyncHandler(async (req: RequestWithAuth, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tournaments } = req.body;

      if (!Array.isArray(tournaments) || tournaments.length === 0) {
        this.sendError(res, 400, 'Tournaments array is required');
        return;
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [] as Array<{ bodNumber: number; error: string }>,
      };

      for (const tournamentData of tournaments) {
        try {
          const existingTournament = await Tournament.findOne({ 
            bodNumber: tournamentData.bodNumber 
          });
          
          if (existingTournament) {
            await Tournament.findByIdAndUpdateSafe(existingTournament._id.toString(), tournamentData);
            results.updated++;
          } else {
            await Tournament.create(tournamentData);
            results.created++;
          }
        } catch (error: any) {
          results.errors.push({
            bodNumber: tournamentData.bodNumber || 0,
            error: error.message,
          });
        }
      }

      const response: ApiResponse = {
        success: true,
        data: results,
        message: `Bulk import completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // Validate tournament data
  private validateTournamentData(data: ITournamentInput): string[] {
    const errors: string[] = [];

    // Validate date
    if (data.date) {
      const date = new Date(data.date);
      const minDate = new Date('2009-01-01');
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 10);

      if (date < minDate || date > maxDate) {
        errors.push('Date must be between 2009 and 10 years in the future');
      }
    }

    // Validate BOD number format
    if (data.bodNumber) {
      const bodStr = data.bodNumber.toString();
      if (bodStr.length !== 6) {
        errors.push('BOD number must be 6 digits (YYYYMM)');
      } else {
        const year = parseInt(bodStr.substring(0, 4));
        const month = parseInt(bodStr.substring(4, 6));
        
        if (year < 2009 || month < 1 || month > 12) {
          errors.push('BOD number must be valid (YYYYMM format)');
        }
      }
    }

    // Validate format
    if (data.format && !TournamentFormats.includes(data.format as any)) {
      errors.push(`Format must be one of: ${TournamentFormats.join(', ')}`);
    }

    // Validate date and BOD number consistency
    if (data.date && data.bodNumber) {
      const date = new Date(data.date);
      const bodStr = data.bodNumber.toString();
      const bodYear = parseInt(bodStr.substring(0, 4));
      const bodMonth = parseInt(bodStr.substring(4, 6));
      
      if (date.getFullYear() !== bodYear || (date.getMonth() + 1) !== bodMonth) {
        errors.push('Date must match BOD number year and month');
      }
    }

    return errors;
  }

  // Override create method to add custom validation
  override async create(req: RequestWithAuth, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationErrors = this.validateTournamentData(req.body);
      
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
      const validationErrors = this.validateTournamentData(req.body);
      
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

  // Delete tournament with cascade delete of results
  override delete = async (req: RequestWithAuth, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { cascade } = req.query;

      const tournament = await Tournament.findById(id);
      if (!tournament) {
        this.sendError(res, 404, 'Tournament not found');
        return;
      }

      // Check if tournament has results
      const resultsCount = await TournamentResult.countDocuments({ tournamentId: id });
      
      if (resultsCount > 0 && cascade !== 'true') {
        this.sendError(res, 400, 
          `Tournament has ${resultsCount} results. Use ?cascade=true to delete tournament and all results.`);
        return;
      }

      // Delete results first if cascade is true
      if (cascade === 'true' && resultsCount > 0) {
        await TournamentResult.deleteMany({ tournamentId: id });
      }

      // Delete the tournament
      await Tournament.findByIdAndDelete(id);

      const response: ApiResponse = {
        success: true,
        message: cascade === 'true' && resultsCount > 0 
          ? `Tournament and ${resultsCount} results deleted successfully`
          : 'Tournament deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export const tournamentController = new TournamentController();