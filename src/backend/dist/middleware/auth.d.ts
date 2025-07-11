import { Response, NextFunction } from 'express';
import { RequestWithAuth } from '../controllers/base';
export declare const verifyGoogleToken: (token: string) => Promise<{
    email: string;
    googleId: string;
    name: string;
    picture: string;
}>;
export declare const isAuthorizedUser: (email: string) => boolean;
export declare const requireAuth: (req: RequestWithAuth, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: RequestWithAuth, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: RequestWithAuth, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map