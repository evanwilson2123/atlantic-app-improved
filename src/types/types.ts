import { CMJTest as PrismaCMJTest } from '@prisma/client'

export interface Athlete {
    id: number;
    dob: Date;
    email: string;
    firstName: string;
    lastName: string;
    sex: string;
    externalId: string;
    profileId: string;
    activeStatus: boolean;
    playLevel: string;
    syncId: string;
    syncedAt: Date;
    recentCompositeScore: number;
    compositeScoreHistory: CompositeScoreHistoryInput[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CompositeScoreHistoryInput {
    score: number;
    date: Date;
}

interface ResultDefinition {
    id: string,
    result: string,
    description: string,
    name: string,
    unit: string,
    repeatable: boolean,
    asymmetry: boolean,
}
  
interface Result {
    resultId: string,
    value: number,
    time: number,
    limb: string,
    repeat: number,
    definition: ResultDefinition
}
  
export interface Trial {
    id: string,
    athleteId: string,
    hubAthleteId: string,
    recordedUTC: string,
    recordedOffset: number,
    recordedTimezone: string,
    startTime: number,
    endTime: number,
    results: Result[]
}

export type CMJTest = PrismaCMJTest

export interface HighPerformanceCompositeScore {
    impt_net_peak_vertical_force: number; //  NET_PEAK_VERTICAL_FORCE_trial_value Float?
    relative_strength_imtp: number; //  RELATIVE_STRENGTH_trial_value Float?
    peak_power_ppu: number; //   PEAK_TAKEOFF_FORCE_trial_value Float?
    sj_peak_power_w: number; //   PEAK_TAKEOFF_POWER_trial_value Float?
    sj_peak_power_w_bw: number; //   BODYMASS_RELATIVE_MEAN_CONCENTRIC_POWER_trial_value Float?
    reactive_strength_index_hj: number; //  HOP_MEAN_RSI_trial_value Float?
}

export enum Tech {
    FORCEPLATES = "FORCEPLATES",
    BLASTMOTION = "BLASTMOTION",
    HITTRAX = "HITTRAX",
    TRACKMAN = "TRACKMAN",
}

export interface LatestTechsResponse {
    vald: Date | undefined;
    blast: Date | undefined;
    trackman: Date | undefined;
    hittrax: Date | undefined;
}
