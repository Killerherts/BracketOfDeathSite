import { BaseDocument } from './common';
export interface ITournament extends BaseDocument {
    date: Date;
    bodNumber: number;
    format: string;
    location: string;
    advancementCriteria: string;
    notes?: string;
    photoAlbums?: string;
}
export interface ITournamentInput {
    date: Date | string;
    bodNumber: number;
    format: string;
    location: string;
    advancementCriteria: string;
    notes?: string;
    photoAlbums?: string;
}
export interface ITournamentUpdate extends Partial<ITournamentInput> {
    _id?: never;
}
export interface ITournamentFilter {
    date?: {
        $gte?: Date;
        $lte?: Date;
    };
    bodNumber?: number | {
        $gte?: number;
        $lte?: number;
    };
    format?: string | RegExp;
    location?: string | RegExp;
    advancementCriteria?: string | RegExp;
}
export declare const TournamentFormats: readonly ["Men's", "Women's", "Mixed", "M", "W"];
export type TournamentFormat = typeof TournamentFormats[number];
//# sourceMappingURL=tournament.d.ts.map