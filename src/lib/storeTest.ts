import { Trial } from "@/types/types"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

interface countMap {
    count: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
}

export async function storeCMJTest(tests: Trial[]): Promise<boolean> {
    const data: Prisma.CMJTestCreateInput[] = [];
    const testId = uuidv4();
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
    }
        await prisma.cMJTest.createMany({ data })
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

export async function storeSJTest(tests: Trial[]): Promise<boolean> {
    const data: Prisma.SJTestCreateInput[] = []
    const testId = uuidv4();
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
        }
        await prisma.sJTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function storeHJTest(tests: Trial[]): Promise<boolean> {
    const data: Prisma.HJTestCreateInput[] = [];
    const testId = uuidv4();
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
        }
        await prisma.hJTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function storePPUTest(tests: Trial[]): Promise<boolean> {
    const data: Prisma.PPUTestCreateInput[] = [];
    const testId = uuidv4();
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
        }
        await prisma.pPUTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(`Error storing PPU test: ${error}`);
        return false;
    }
}

export async function storeIMTPTest(tests: Trial[]): Promise<boolean> {
    const data: Prisma.IMTPTestCreateInput[] = [];
    const testId = uuidv4();
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
        }
        await prisma.iMTPTest.createMany({ data });
        return true;
    } catch (error) {
        console.error(`Error storing IMTP test: ${error}`);
        return false;
    }
}