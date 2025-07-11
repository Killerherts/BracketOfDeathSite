import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { DataMigrationController } from '../controllers/DataMigrationController';

const router = Router();

// All data routes require authentication
const dataMigrationController = new DataMigrationController();

// Migration endpoints
router.post('/migrate', requireAuth, dataMigrationController.migrateAll);
router.post('/migrate/players', requireAuth, dataMigrationController.migratePlayers);
router.post('/migrate/tournaments', requireAuth, dataMigrationController.migrateTournaments);
router.post('/migrate/results', requireAuth, dataMigrationController.migrateResults);

// Migration status and info
router.get('/migration/status', requireAuth, dataMigrationController.getMigrationStatus);
router.get('/migration/preview', requireAuth, dataMigrationController.previewMigration);

// Backup and restore
router.post('/backup', requireAuth, dataMigrationController.createBackup);
router.post('/restore', requireAuth, dataMigrationController.restoreBackup);

// Validation
router.post('/validate', requireAuth, dataMigrationController.validateData);

export default router;