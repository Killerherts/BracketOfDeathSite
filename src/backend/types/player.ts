import { BaseDocument } from './common';

export interface IPlayer extends BaseDocument {
  name: string;
  bodsPlayed: number;
  bestResult: number;
  avgFinish: number;
  gamesPlayed: number;
  gamesWon: number;
  winningPercentage: number;
  individualChampionships: number;
  divisionChampionships: number;
  totalChampionships: number;
  drawingSequence?: number;
  pairing?: string;
}

export interface IPlayerInput {
  name: string;
  bodsPlayed?: number;
  bestResult?: number;
  avgFinish?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  winningPercentage?: number;
  individualChampionships?: number;
  divisionChampionships?: number;
  totalChampionships?: number;
  drawingSequence?: number;
  pairing?: string;
}

export interface IPlayerUpdate extends Partial<IPlayerInput> {
  _id?: never; // Prevent ID updates
}

export interface IPlayerFilter {
  name?: string | RegExp;
  bodsPlayed?: { $gte?: number; $lte?: number };
  bestResult?: { $gte?: number; $lte?: number };
  avgFinish?: { $gte?: number; $lte?: number };
  winningPercentage?: { $gte?: number; $lte?: number };
  totalChampionships?: { $gte?: number; $lte?: number };
}