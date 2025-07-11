import { Router } from 'express';
import playersRoutes from './players';
import tournamentsRoutes from './tournaments';
import tournamentResultsRoutes from './tournamentResults';
import dataRoutes from './data';

const router = Router();

// Mount all route modules
router.use('/players', playersRoutes);
router.use('/tournaments', tournamentsRoutes);
router.use('/tournament-results', tournamentResultsRoutes);
router.use('/data', dataRoutes);

// API info endpoint
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

export default router;