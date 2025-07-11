"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentController = exports.TournamentController = void 0;
const Tournament_1 = require("../models/Tournament");
const TournamentResult_1 = require("../models/TournamentResult");
const tournament_1 = require("../types/tournament");
const base_1 = require("./base");
class TournamentController extends base_1.BaseController {
    constructor() {
        super(Tournament_1.Tournament, 'Tournament');
    }
    buildFilter(query) {
        const filter = {};
        const { page, limit, sort, select, populate, q, ...filterParams } = query;
        if (filterParams.startDate || filterParams.endDate) {
            filter.date = {};
            if (filterParams.startDate) {
                filter.date.$gte = new Date(filterParams.startDate);
            }
            if (filterParams.endDate) {
                filter.date.$lte = new Date(filterParams.endDate);
            }
        }
        else if (filterParams.date) {
            filter.date = new Date(filterParams.date);
        }
        if (filterParams.year) {
            const year = parseInt(filterParams.year);
            filter.date = {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`),
            };
        }
        if (filterParams.bodNumber) {
            filter.bodNumber = parseInt(filterParams.bodNumber);
        }
        else if (filterParams.bodNumber_min || filterParams.bodNumber_max) {
            filter.bodNumber = {};
            if (filterParams.bodNumber_min) {
                filter.bodNumber.$gte = parseInt(filterParams.bodNumber_min);
            }
            if (filterParams.bodNumber_max) {
                filter.bodNumber.$lte = parseInt(filterParams.bodNumber_max);
            }
        }
        if (filterParams.format) {
            filter.format = filterParams.format;
        }
        if (filterParams.location) {
            filter.location = new RegExp(filterParams.location, 'i');
        }
        if (filterParams.advancementCriteria) {
            filter.advancementCriteria = new RegExp(filterParams.advancementCriteria, 'i');
        }
        return filter;
    }
    buildSearchFilter(searchTerm) {
        return {
            $or: [
                { location: new RegExp(searchTerm, 'i') },
                { notes: new RegExp(searchTerm, 'i') },
                { advancementCriteria: new RegExp(searchTerm, 'i') },
            ],
        };
    }
    getStats = this.asyncHandler(async (req, res, next) => {
        try {
            const stats = await Tournament_1.Tournament.aggregate([
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
            const formatStats = await Tournament_1.Tournament.aggregate([
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
            const yearlyStats = await Tournament_1.Tournament.aggregate([
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
            const response = {
                success: true,
                data: {
                    overview: stats[0] || {},
                    formatBreakdown: formatStats,
                    yearlyBreakdown: yearlyStats,
                },
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    getByYear = this.asyncHandler(async (req, res, next) => {
        try {
            const { year } = req.params;
            const yearInt = parseInt(year);
            if (isNaN(yearInt) || yearInt < 2009 || yearInt > new Date().getFullYear() + 10) {
                this.sendError(res, 400, 'Invalid year provided');
                return;
            }
            const tournaments = await Tournament_1.Tournament.find({
                date: {
                    $gte: new Date(`${yearInt}-01-01`),
                    $lte: new Date(`${yearInt}-12-31`),
                },
            }).sort({ date: 1 });
            const response = {
                success: true,
                data: tournaments,
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    getByFormat = this.asyncHandler(async (req, res, next) => {
        try {
            const { format } = req.params;
            if (!tournament_1.TournamentFormats.includes(format)) {
                this.sendError(res, 400, `Invalid format. Must be one of: ${tournament_1.TournamentFormats.join(', ')}`);
                return;
            }
            const tournaments = await Tournament_1.Tournament.find({ format }).sort({ date: -1 });
            const response = {
                success: true,
                data: tournaments,
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    getWithResults = this.asyncHandler(async (req, res, next) => {
        try {
            const { id } = req.params;
            const tournament = await Tournament_1.Tournament.findById(id);
            if (!tournament) {
                this.sendError(res, 404, 'Tournament not found');
                return;
            }
            const results = await TournamentResult_1.TournamentResult.find({ tournamentId: id })
                .populate('players', 'name')
                .sort({ 'totalStats.finalRank': 1, 'totalStats.winPercentage': -1 });
            const response = {
                success: true,
                data: {
                    tournament,
                    results,
                    resultCount: results.length,
                },
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    getUpcoming = this.asyncHandler(async (req, res, next) => {
        try {
            const now = new Date();
            const limit = parseInt(req.query.limit) || 10;
            const upcomingTournaments = await Tournament_1.Tournament.find({
                date: { $gte: now },
            })
                .sort({ date: 1 })
                .limit(limit);
            const response = {
                success: true,
                data: upcomingTournaments,
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    getRecent = this.asyncHandler(async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const recentTournaments = await Tournament_1.Tournament.find({})
                .sort({ date: -1 })
                .limit(limit);
            const response = {
                success: true,
                data: recentTournaments,
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    bulkImport = this.asyncHandler(async (req, res, next) => {
        try {
            const { tournaments } = req.body;
            if (!Array.isArray(tournaments) || tournaments.length === 0) {
                this.sendError(res, 400, 'Tournaments array is required');
                return;
            }
            const results = {
                created: 0,
                updated: 0,
                errors: [],
            };
            for (const tournamentData of tournaments) {
                try {
                    const existingTournament = await Tournament_1.Tournament.findOne({
                        bodNumber: tournamentData.bodNumber
                    });
                    if (existingTournament) {
                        await Tournament_1.Tournament.findByIdAndUpdateSafe(existingTournament._id, tournamentData);
                        results.updated++;
                    }
                    else {
                        await Tournament_1.Tournament.create(tournamentData);
                        results.created++;
                    }
                }
                catch (error) {
                    results.errors.push({
                        bodNumber: tournamentData.bodNumber || 0,
                        error: error.message,
                    });
                }
            }
            const response = {
                success: true,
                data: results,
                message: `Bulk import completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    validateTournamentData(data) {
        const errors = [];
        if (data.date) {
            const date = new Date(data.date);
            const minDate = new Date('2009-01-01');
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 10);
            if (date < minDate || date > maxDate) {
                errors.push('Date must be between 2009 and 10 years in the future');
            }
        }
        if (data.bodNumber) {
            const bodStr = data.bodNumber.toString();
            if (bodStr.length !== 6) {
                errors.push('BOD number must be 6 digits (YYYYMM)');
            }
            else {
                const year = parseInt(bodStr.substring(0, 4));
                const month = parseInt(bodStr.substring(4, 6));
                if (year < 2009 || month < 1 || month > 12) {
                    errors.push('BOD number must be valid (YYYYMM format)');
                }
            }
        }
        if (data.format && !tournament_1.TournamentFormats.includes(data.format)) {
            errors.push(`Format must be one of: ${tournament_1.TournamentFormats.join(', ')}`);
        }
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
    create = this.asyncHandler(async (req, res, next) => {
        try {
            const validationErrors = this.validateTournamentData(req.body);
            if (validationErrors.length > 0) {
                this.sendError(res, 400, validationErrors.join(', '));
                return;
            }
            await super.create(req, res, next);
        }
        catch (error) {
            next(error);
        }
    });
    update = this.asyncHandler(async (req, res, next) => {
        try {
            const validationErrors = this.validateTournamentData(req.body);
            if (validationErrors.length > 0) {
                this.sendError(res, 400, validationErrors.join(', '));
                return;
            }
            await super.update(req, res, next);
        }
        catch (error) {
            next(error);
        }
    });
    delete = this.asyncHandler(async (req, res, next) => {
        try {
            const { id } = req.params;
            const { cascade } = req.query;
            const tournament = await Tournament_1.Tournament.findById(id);
            if (!tournament) {
                this.sendError(res, 404, 'Tournament not found');
                return;
            }
            const resultsCount = await TournamentResult_1.TournamentResult.countDocuments({ tournamentId: id });
            if (resultsCount > 0 && cascade !== 'true') {
                this.sendError(res, 400, `Tournament has ${resultsCount} results. Use ?cascade=true to delete tournament and all results.`);
                return;
            }
            if (cascade === 'true' && resultsCount > 0) {
                await TournamentResult_1.TournamentResult.deleteMany({ tournamentId: id });
            }
            await Tournament_1.Tournament.findByIdAndDelete(id);
            const response = {
                success: true,
                message: cascade === 'true' && resultsCount > 0
                    ? `Tournament and ${resultsCount} results deleted successfully`
                    : 'Tournament deleted successfully',
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
}
exports.TournamentController = TournamentController;
exports.tournamentController = new TournamentController();
//# sourceMappingURL=TournamentController.js.map