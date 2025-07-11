"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerController = exports.PlayerController = void 0;
const Player_1 = require("../models/Player");
const base_1 = require("./base");
class PlayerController extends base_1.BaseController {
    constructor() {
        super(Player_1.Player, 'Player');
    }
    // Override buildFilter for player-specific filtering
    buildFilter(query) {
        const filter = {};
        const { page, limit, sort, select, populate, q, ...filterParams } = query;
        // Name search (case insensitive)
        if (filterParams.name) {
            filter.name = new RegExp(filterParams.name, 'i');
        }
        // Numeric range filters
        const numericFields = ['bodsPlayed', 'bestResult', 'avgFinish', 'winningPercentage', 'totalChampionships'];
        numericFields.forEach(field => {
            const value = filterParams[field];
            const minValue = filterParams[`${field}_min`];
            const maxValue = filterParams[`${field}_max`];
            if (value !== undefined) {
                filter[field] = parseFloat(value);
            }
            else if (minValue !== undefined || maxValue !== undefined) {
                filter[field] = {};
                if (minValue !== undefined) {
                    filter[field].$gte = parseFloat(minValue);
                }
                if (maxValue !== undefined) {
                    filter[field].$lte = parseFloat(maxValue);
                }
            }
        });
        return filter;
    }
    // Override buildSearchFilter for player-specific search
    buildSearchFilter(searchTerm) {
        return {
            $or: [
                { name: new RegExp(searchTerm, 'i') },
                { pairing: new RegExp(searchTerm, 'i') },
            ],
        };
    }
    // Get player statistics
    getStats = this.asyncHandler(async (_req, res, next) => {
        try {
            const stats = await Player_1.Player.aggregate([
                {
                    $group: {
                        _id: null,
                        totalPlayers: { $sum: 1 },
                        avgWinningPercentage: { $avg: '$winningPercentage' },
                        avgBodsPlayed: { $avg: '$bodsPlayed' },
                        totalChampionships: { $sum: '$totalChampionships' },
                        maxWinningPercentage: { $max: '$winningPercentage' },
                        minWinningPercentage: { $min: '$winningPercentage' },
                    },
                },
            ]);
            const topPlayers = await Player_1.Player.find({})
                .sort({ winningPercentage: -1, totalChampionships: -1 })
                .limit(10)
                .select('name winningPercentage totalChampionships bodsPlayed');
            const response = {
                success: true,
                data: {
                    overview: stats[0] || {},
                    topPlayers,
                },
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    // Get players by championship count
    getChampions = this.asyncHandler(async (req, res, next) => {
        try {
            const minChampionships = parseInt(req.query.min) || 1;
            const champions = await Player_1.Player.find({
                totalChampionships: { $gte: minChampionships }
            })
                .sort({ totalChampionships: -1, winningPercentage: -1 })
                .select('name totalChampionships individualChampionships divisionChampionships winningPercentage bodsPlayed');
            const response = {
                success: true,
                data: champions,
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    // Get player performance trends
    getPerformanceTrends = this.asyncHandler(async (req, res, next) => {
        try {
            const { id } = req.params;
            const player = await Player_1.Player.findById(id);
            if (!player) {
                this.sendError(res, 404, 'Player not found');
                return;
            }
            // This would ideally query tournament results for trend analysis
            // For now, we'll return basic performance metrics
            const performanceData = {
                currentWinningPercentage: player.winningPercentage,
                championshipRatio: player.bodsPlayed > 0 ? player.totalChampionships / player.bodsPlayed : 0,
                gamesPerBod: player.bodsPlayed > 0 ? player.gamesPlayed / player.bodsPlayed : 0,
                consistencyScore: this.calculateConsistencyScore(player),
            };
            const response = {
                success: true,
                data: performanceData,
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    });
    // Update player statistics (for data migration/admin use)
    updateStats = this.asyncHandler(async (req, res, next) => {
        try {
            const { id } = req.params;
            const statsUpdate = req.body;
            // Validate that required stats are provided
            const requiredStats = ['gamesPlayed', 'gamesWon'];
            const missing = this.validateRequired(requiredStats, statsUpdate);
            if (missing.length > 0) {
                this.sendError(res, 400, `Missing required fields: ${missing.join(', ')}`);
                return;
            }
            // Ensure games won doesn't exceed games played
            if (statsUpdate.gamesWon > statsUpdate.gamesPlayed) {
                this.sendError(res, 400, 'Games won cannot exceed games played');
                return;
            }
            const updatedPlayer = await Player_1.Player.findByIdAndUpdateSafe(id, statsUpdate);
            if (!updatedPlayer) {
                this.sendError(res, 404, 'Player not found');
                return;
            }
            this.sendSuccess(res, updatedPlayer, 'Player statistics updated successfully');
        }
        catch (error) {
            next(error);
        }
    });
    // Bulk import players (for data migration)
    bulkImport = this.asyncHandler(async (req, res, next) => {
        try {
            const { players } = req.body;
            if (!Array.isArray(players) || players.length === 0) {
                this.sendError(res, 400, 'Players array is required');
                return;
            }
            const results = {
                created: 0,
                updated: 0,
                errors: [],
            };
            for (const playerData of players) {
                try {
                    const existingPlayer = await Player_1.Player.findOne({ name: playerData.name });
                    if (existingPlayer) {
                        await Player_1.Player.findByIdAndUpdateSafe(existingPlayer._id.toString(), playerData);
                        results.updated++;
                    }
                    else {
                        await Player_1.Player.create(playerData);
                        results.created++;
                    }
                }
                catch (error) {
                    results.errors.push({
                        name: playerData.name || 'Unknown',
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
    // Helper method to calculate consistency score
    calculateConsistencyScore(player) {
        // Simple consistency score based on the relationship between
        // best result and average finish
        if (!player.bestResult || !player.avgFinish || player.avgFinish === 0) {
            return 0;
        }
        // Lower ratio = more consistent (best result closer to average)
        const ratio = player.bestResult / player.avgFinish;
        return Math.max(0, Math.min(1, 1 - (ratio - 1)));
    }
    // Validate player data
    validatePlayerData(data) {
        const errors = [];
        if (data.gamesWon && data.gamesPlayed && data.gamesWon > data.gamesPlayed) {
            errors.push('Games won cannot exceed games played');
        }
        if (data.winningPercentage && (data.winningPercentage < 0 || data.winningPercentage > 1)) {
            errors.push('Winning percentage must be between 0 and 1');
        }
        if (data.bestResult && data.avgFinish && data.bestResult > data.avgFinish) {
            errors.push('Best result cannot be worse than average finish');
        }
        return errors;
    }
    // Override create method to add custom validation
    async create(req, res, next) {
        try {
            const validationErrors = this.validatePlayerData(req.body);
            if (validationErrors.length > 0) {
                this.sendError(res, 400, validationErrors.join(', '));
                return;
            }
            // Call parent create method
            await super.create(req, res, next);
        }
        catch (error) {
            next(error);
        }
    }
    // Override update method to add custom validation
    async update(req, res, next) {
        try {
            const validationErrors = this.validatePlayerData(req.body);
            if (validationErrors.length > 0) {
                this.sendError(res, 400, validationErrors.join(', '));
                return;
            }
            // Call parent update method
            await super.update(req, res, next);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PlayerController = PlayerController;
exports.playerController = new PlayerController();
//# sourceMappingURL=PlayerController.js.map