"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.optionalAuth = exports.requireAuth = exports.isAuthorizedUser = exports.verifyGoogleToken = void 0;
// Mock authentication for development - replace with Google OAuth in production
const verifyGoogleToken = async (token) => {
    // TODO: Implement actual Google token verification
    if (token === 'mock-admin-token') {
        return {
            email: 'admin@example.com',
            googleId: 'mock-admin-id',
            name: 'Admin User',
            picture: '',
        };
    }
    throw new Error('Invalid token');
};
exports.verifyGoogleToken = verifyGoogleToken;
// Check if user is authorized
const isAuthorizedUser = (email) => {
    const authorizedUsers = process.env.AUTHORIZED_USERS?.split(',') || ['admin@example.com'];
    return authorizedUsers.map(u => u.trim().toLowerCase()).includes(email.toLowerCase());
};
exports.isAuthorizedUser = isAuthorizedUser;
// Authentication middleware
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const response = {
                success: false,
                error: 'Authorization token required',
            };
            res.status(401).json(response);
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!token) {
            const response = {
                success: false,
                error: 'Authorization token required',
            };
            res.status(401).json(response);
            return;
        }
        // Verify the token
        const userInfo = await (0, exports.verifyGoogleToken)(token);
        // Check if user is authorized
        const isAuthorized = (0, exports.isAuthorizedUser)(userInfo.email);
        if (!isAuthorized) {
            const response = {
                success: false,
                error: 'Access denied. User not authorized.',
            };
            res.status(403).json(response);
            return;
        }
        // Add user info to request
        req.user = {
            email: userInfo.email,
            googleId: userInfo.googleId,
            isAuthorized: true,
        };
        next();
    }
    catch (error) {
        const response = {
            success: false,
            error: 'Invalid or expired token',
        };
        res.status(401).json(response);
    }
};
exports.requireAuth = requireAuth;
// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token) {
                try {
                    const userInfo = await (0, exports.verifyGoogleToken)(token);
                    const isAuthorized = (0, exports.isAuthorizedUser)(userInfo.email);
                    req.user = {
                        email: userInfo.email,
                        googleId: userInfo.googleId,
                        isAuthorized,
                    };
                }
                catch (error) {
                    // Invalid token, but don't fail the request
                    req.user = undefined;
                }
            }
        }
        next();
    }
    catch (error) {
        // Don't fail the request for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
// Admin-only middleware
const requireAdmin = async (req, res, next) => {
    // First check authentication
    await (0, exports.requireAuth)(req, res, () => {
        // Add additional admin checks here if needed
        // For now, all authorized users are considered admins
        if (req.user && req.user.isAuthorized) {
            next();
        }
        else {
            const response = {
                success: false,
                error: 'Admin access required',
            };
            res.status(403).json(response);
        }
    });
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map