import { Request, Response, NextFunction } from 'express';
import { ITournamentResult, ITournamentResultFilter } from '../types/tournamentResult';
import { BaseController, RequestWithAuth } from './base';
export declare class TournamentResultController extends BaseController<ITournamentResult> {
    constructor();
    protected buildFilter(query: any): ITournamentResultFilter;
    getAll: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getByTournament: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getByPlayer: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getLeaderboard: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getStats: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    bulkImport: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    private parseSortString;
    private calculatePlayerStats;
    private validateTournamentResultData;
    create: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    update: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
}
export declare const tournamentResultController: TournamentResultController;
//# sourceMappingURL=TournamentResultController.d.ts.map