"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.optionalAuth = exports.requireAuth = exports.isAuthorizedUser = exports.verifyGoogleToken = void 0;
const verifyGoogleToken = async (token) => {
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
const isAuthorizedUser = (email) => {
    const authorizedUsers = process.env.AUTHORIZED_USERS?.split(',') || ['admin@example.com'];
    return authorizedUsers.map(u => u.trim().toLowerCase()).includes(email.toLowerCase());
};
exports.isAuthorizedUser = isAuthorizedUser;
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
        const token = authHeader.substring(7);
        if (!token) {
            const response = {
                success: false,
                error: 'Authorization token required',
            };
            res.status(401).json(response);
            return;
        }
        const userInfo = await (0, exports.verifyGoogleToken)(token);
        const isAuthorized = (0, exports.isAuthorizedUser)(userInfo.email);
        if (!isAuthorized) {
            const response = {
                success: false,
                error: 'Access denied. User not authorized.',
            };
            res.status(403).json(response);
            return;
        }
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
                    req.user = undefined;
                }
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireAdmin = async (req, res, next) => {
    await (0, exports.requireAuth)(req, res, () => {
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