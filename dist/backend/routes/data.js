"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const DataMigrationController_1 = require("../controllers/DataMigrationController");
const router = (0, express_1.Router)();
const dataMigrationController = new DataMigrationController_1.DataMigrationController();
router.post('/migrate', auth_1.requireAuth, dataMigrationController.migrateAll);
router.post('/migrate/players', auth_1.requireAuth, dataMigrationController.migratePlayers);
router.post('/migrate/tournaments', auth_1.requireAuth, dataMigrationController.migrateTournaments);
router.post('/migrate/results', auth_1.requireAuth, dataMigrationController.migrateResults);
router.get('/migration/status', auth_1.requireAuth, dataMigrationController.getMigrationStatus);
router.get('/migration/preview', auth_1.requireAuth, dataMigrationController.previewMigration);
router.post('/backup', auth_1.requireAuth, dataMigrationController.createBackup);
router.post('/restore', auth_1.requireAuth, dataMigrationController.restoreBackup);
router.post('/validate', auth_1.requireAuth, dataMigrationController.validateData);
exports.default = router;
//# sourceMappingURL=data.js.map