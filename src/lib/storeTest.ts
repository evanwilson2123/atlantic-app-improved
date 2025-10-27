import { Trial } from "@/types/types"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { SimpleVALDForceDecksAPI } from "./forcedecks-api";

interface countMap {
    count: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
}

export async function storeCMJTest(tests: Trial[], testId: string, markedForUpsert: boolean, playLevel: string): Promise<boolean> {
    const data: Prisma.CMJTestCreateInput[] = [];
    try {
        for (const trial of tests) {
            const trialData: Prisma.CMJTestCreateInput = {
                athleteId: trial.athleteId,
                recordedUTC: new Date(trial.recordedUTC),
                recordedTimeZone: trial.recordedTimezone,
                testId: testId,
        } as Prisma.CMJTestCreateInput
        data.push(trialData)
        for (const result of trial.results) {
            const name = result.definition.result
            const limbKey = result.limb === "Asym" ? "asymm" : result.limb.toLowerCase()
            const valueKey = `${name}_${limbKey}_value`
            const unitKey = `${name}_${limbKey}_unit`
            ;(trialData as Record<string, unknown>)[valueKey] = result.value
            ;(trialData as Record<string, unknown>)[unitKey] = result.definition.unit
        }
        if (markedForUpsert) {
            ;(trialData as Record<string, unknown>).marked_for_upsert = true;
        }
        if (playLevel) {
            ;(trialData as Record<string, unknown>).playing_level = playLevel;
        }
    }
        await prisma.cMJTest.createMany({ data })
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

export async function storeSJTest(tests: Trial[], testId: string, markedForUpsert: boolean, playLevel: string): Promise<boolean> {
    const data: Prisma.SJTestCreateInput[] = []
    try {
        for (const trial of tests) {
            const trialData: Prisma.SJTestCreateInput = {
                athleteId: trial.athleteId,
                recordedUTC: new Date(trial.recordedUTC),
                recordedTimeZone: trial.recordedTimezone,
                testId: testId,
            } as Prisma.SJTestCreateInput
            data.push(trialData);       
            for (const result of trial.results) {
                const name = result.definition.result;
                const limbKey = result.limb === "Asym" ? "asymm" : result.limb.toLowerCase();
                const valueKey = `${name}_${limbKey}_value`;
                const unitKey = `${name}_${limbKey}_unit`;
                ;(trialData as Record<string, unknown>)[valueKey] = result.value;
                ;(trialData as Record<string, unknown>)[unitKey] = result.definition.unit;
            } 
            if (markedForUpsert) {
                ;(trialData as Record<string, unknown>).marked_for_upsert = true;
            }
            if (playLevel) {
                ;(trialData as Record<string, unknown>).playing_level = playLevel;
            }
        }
        await prisma.sJTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function storeHJTest(tests: Trial[], testId: string, markedForUpsert: boolean, playLevel: string): Promise<boolean> {
    const data: Prisma.HJTestCreateInput[] = [];
    const averageMap: Map<string, countMap> = new Map(); 
    try {
        for (const trial of tests) {
            const trialData: Prisma.HJTestCreateInput = {
                athleteId: trial.athleteId,
                recordedUTC: new Date(trial.recordedUTC),
                recordedTimeZone: trial.recordedTimezone,
                testId: testId,
            } as Prisma.HJTestCreateInput;
            data.push(trialData);
            for (const result of trial.results) {
                const name = result.definition.result;
                const limbKey = result.limb === "Asym" ? "asymm" : result.limb.toLowerCase();
                const valueKey = `${name}_${limbKey}_value`;
                const unitKey = `${name}_${limbKey}_unit`;
                if (!averageMap.has(valueKey)) {
                    averageMap.set(valueKey, { count: 1, value: result.value });
                } else {
                    const countMap = averageMap.get(valueKey);
                    if (!countMap) {
                        averageMap.set(name, { count: 1, value: result.value });
                    }

                    if (!countMap?.count) {
                        countMap!.count = 1;
                        countMap!.value = result.value;
                    } else {
                        countMap.count++;
                        countMap.value += result.value;
                    }
                }
                if (!averageMap.has(unitKey)) {
                    averageMap.set(unitKey, { count: 1, value: result.definition.unit });
                }
            }
            for (const [key, value] of averageMap) {
                if (typeof value.value === "number") {
                    ;(trialData as Record<string, unknown>)[key] = value.value / value.count;
                } else {
                    ;(trialData as Record<string, unknown>)[key] = value.value;
                }
            }
            averageMap.clear();
            if (markedForUpsert) {
                ;(trialData as Record<string, unknown>).marked_for_upsert = true;
            }
            if (playLevel) {
                ;(trialData as Record<string, unknown>).playing_level = playLevel;
            }
        }
        await prisma.hJTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function storePPUTest(tests: Trial[], testId: string, markedForUpsert: boolean, playLevel: string): Promise<boolean> {
    const data: Prisma.PPUTestCreateInput[] = [];
    try {
        for (const trial of tests) {
            const trialData: Prisma.PPUTestCreateInput = {
                athleteId: trial.athleteId,
                recordedUTC: new Date(trial.recordedUTC),
                recordedTimeZone: trial.recordedTimezone,
                testId: testId,
            } as Prisma.PPUTestCreateInput;
            data.push(trialData);
            for (const result of trial.results) {
                const name = result.definition.result;
                const limbKey = result.limb === "Asym" ? "asymm" : result.limb.toLowerCase();
                const valueKey = `${name}_${limbKey}_value`;
                const unitKey = `${name}_${limbKey}_unit`;
                ;(trialData as Record<string, unknown>)[valueKey] = result.value;
                ;(trialData as Record<string, unknown>)[unitKey] = result.definition.unit;
            }
            if (markedForUpsert) {
                ;(trialData as Record<string, unknown>).marked_for_upsert = true;
            }
            if (playLevel) {
                ;(trialData as Record<string, unknown>).playing_level = playLevel;
            }
        }
        await prisma.pPUTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(`Error storing PPU test: ${error}`);
        return false;
    }
}

export async function storeIMTPTest(tests: Trial[], testId: string, markedForUpsert: boolean, playLevel: string): Promise<boolean> {
    const data: Prisma.IMTPTestCreateInput[] = [];
    const valdForceDecksAPI = new SimpleVALDForceDecksAPI();
    const valdTest = await valdForceDecksAPI.getTest(testId, tests[0].athleteId);
    if (!valdTest || typeof valdTest.weight !== "number") {
        console.error(`Body weight not found for test ${testId}`);
        return false;
    }
    const bodyWeightN = valdTest.weight * 9.81;
    try {
        for (const trial of tests) {
            const trialData: Prisma.IMTPTestCreateInput = {
                athleteId: trial.athleteId,
                recordedUTC: new Date(trial.recordedUTC),
                recordedTimeZone: trial.recordedTimezone,
                testId: testId,
            } as Prisma.IMTPTestCreateInput;
            data.push(trialData);
            for (const result of trial.results) {
                const name = result.definition.result;
                const limbKey = result.limb === "Asym" ? "asymm" : result.limb.toLowerCase();
                const valueKey = `${name}_${limbKey}_value`;
                const unitKey = `${name}_${limbKey}_unit`;
                ;(trialData as Record<string, unknown>)[valueKey] = result.value;
                ;(trialData as Record<string, unknown>)[unitKey] = result.definition.unit;
            }
            if (markedForUpsert) {
                ;(trialData as Record<string, unknown>).marked_for_upsert = true;
            }
            if (playLevel) {
                ;(trialData as Record<string, unknown>).playing_level = playLevel;
            }
        }
        for (const trial of data) {
            const netPeakVerticalForce = (trial.PEAK_VERTICAL_FORCE_trial_value as number) - bodyWeightN;
            const relativeStrength = netPeakVerticalForce / bodyWeightN;
            const netPeakVerticalForceValueKey = "NET_PEAK_VERTICAL_FORCE_trial_value";
            const netPeakVerticalForceUnitKey = "NET_PEAK_VERTICAL_FORCE_trial_unit";
            const relativeStrengthValueKey = "RELATIVE_STRENGTH_trial_value";
            const relativeStrengthUnitKey = "RELATIVE_STRENGTH_trial_unit";
            ;(trial as Record<string, unknown>)[netPeakVerticalForceValueKey] = netPeakVerticalForce;
            ;(trial as Record<string, unknown>)[relativeStrengthValueKey] = relativeStrength;
            ;(trial as Record<string, unknown>)[netPeakVerticalForceUnitKey] = "N";
            ;(trial as Record<string, unknown>)[relativeStrengthUnitKey] = "N";
        }
        await prisma.iMTPTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(`Error storing IMTP test: ${error}`);
        return false;
    }
}