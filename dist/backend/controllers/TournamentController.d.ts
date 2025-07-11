import { Request, Response, NextFunction } from 'express';
import { ITournament, ITournamentFilter } from '../types/tournament';
import { BaseController, RequestWithAuth } from './base';
export declare class TournamentController extends BaseController<ITournament> {
    constructor();
    protected buildFilter(query: any): ITournamentFilter;
    protected buildSearchFilter(searchTerm: string): any;
    getStats: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getByYear: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getByFormat: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getWithResults: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getUpcoming: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    getRecent: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    bulkImport: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    private validateTournamentData;
    create: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    update: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
    delete: (req: Request | RequestWithAuth, res: Response, next: NextFunction) => void;
}
export declare const tournamentController: TournamentController;
//# sourceMappingURL=TournamentController.d.ts.map