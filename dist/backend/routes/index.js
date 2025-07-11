"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const players_1 = __importDefault(require("./players"));
const tournaments_1 = __importDefault(require("./tournaments"));
const tournamentResults_1 = __importDefault(require("./tournamentResults"));
const data_1 = __importDefault(require("./data"));
const router = (0, express_1.Router)();
router.use('/players', players_1.default);
router.use('/tournaments', tournaments_1.default);
router.use('/tournament-results', tournamentResults_1.default);
router.use('/data', data_1.default);
router.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Bracket of Death API',
        version: '1.0.0',
        endpoints: {
            players: '/api/players',
            tournaments: '/api/tournaments',
            tournamentResults: '/api/tournament-results',
            data: '/api/data',
        },
        documentation: 'See CLAUDE.md for API documentation',
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map