"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const validation_1 = require("./middleware/validation");
const routes_1 = __importDefault(require("./routes"));
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
// Logging
app.use((0, morgan_1.default)('combined'));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Global middleware
app.use(validation_1.sanitizeInput);
app.use(validation_1.validatePagination);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api', routes_1.default);
// Error handling middleware
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Start server function
const startServer = async () => {
    try {
        await (0, database_1.connectToDatabase)();
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Process terminated');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
exports.startServer = startServer;
// Start the server if this file is run directly
if (require.main === module) {
    (0, exports.startServer)().catch(console.error);
}
exports.default = app;
//# sourceMappingURL=server.js.map