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
    createdAt: Date;
    updatedAt: Date;
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
