import { NextRequest, NextResponse } from "next/server";
import { SimpleVALDForceDecksAPI, VALDTest } from "@/lib/forcedecks-api";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/roleChecks";
import { prisma } from "@/lib/db";
import { storeCMJTest, storeHJTest, storeIMTPTest, storePPUTest, storeSJTest } from "@/lib/storeTest";
import { Trial } from "@/types/types";

async function getLatestTests(profileId: string): Promise<Date | undefined> {
    const cmjTest = await prisma.cMJTest.findFirst({
        where: {
            athleteId: profileId,
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
        },
    });
    const sjTest = await prisma.sJTest.findFirst({
        where: {
            athleteId: profileId,
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
        },
    });
    const hjTest = await prisma.hJTest.findFirst({
        where: {
            athleteId: profileId,
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
        },
    });
    const ppTest = await prisma.pPUTest.findFirst({
        where: {
            athleteId: profileId,
        },
    });
    const imtpTest = await prisma.iMTPTest.findFirst({
        where: {
            athleteId: profileId,
        },
        orderBy: {
            recordedUTC: "desc",
        },
    });
    const latestTests = [cmjTest, sjTest, hjTest, ppTest, imtpTest];
    const latestDate = latestTests
        .map(test => test?.recordedUTC)
        .filter((d): d is Date => d instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())
        .at(-1);
    return latestDate;
}

export async function POST(req: NextRequest, context: { params: Promise<{ profileId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(userId)) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profileId } = await context.params;
    if (!profileId) {
        console.error("Missing required parameter: profileId");
        return NextResponse.json({ error: "Missing required parameters: profileId" }, { status: 400 });
    }
    try {
        const athlete = await prisma.athlete.findFirst({
            where: {
                profileId: profileId,
            },
            select: {
                id: true,
                imtpTestCounter: true,
                sjTestCounter: true,
                hjTestCounter: true,
                ppuTestCounter: true,
                cmjTestCounter: true,
                playLevel: true,
                forceplatesLatestSync: true,
            }
        });
        if (!athlete) {
            console.error("Athlete not found");
            return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
        }
        const latestForceplatesSync = athlete.forceplatesLatestSync;
        const valdForceDecksAPI = new SimpleVALDForceDecksAPI();
        let tests: VALDTest[] = [];
        if (latestForceplatesSync) {
            const resp = (await valdForceDecksAPI.getUnsyncedTests(profileId, latestForceplatesSync.toISOString())) ?? [];
            tests = resp?.tests ?? [];
        } else {
            const resp = await valdForceDecksAPI.getTests(new Date(0).toISOString(), profileId);
            tests = resp?.tests ?? [];
        }
        console.log(`Found ${tests.length} tests to sync`);
        if (tests.length === 0) {
            console.log("No tests to sync");
            return NextResponse.json({ success: true }, { status: 200 });
        }
        // Track which calendar days we've already counted per test type
        const seenDays: Record<string, Set<string>> = {
            CMJ: new Set<string>(),
            SJ: new Set<string>(),
            HJ: new Set<string>(),
            PPU: new Set<string>(),
            IMTP: new Set<string>(),
        };

        for (const test of tests) {
            console.log(`Syncing test: ${test.testType}`);
            // Normalize recorded date to UTC YYYY-MM-DD for day-level counting
            const recorded = new Date(test.recordedDateUtc);
            const dayKey = Number.isNaN(recorded.getTime())
                ? String(test.recordedDateUtc).slice(0, 10)
                : recorded.toISOString().slice(0, 10);
            switch (test.testType) {
                case "CMJ": {
                    const trials: Trial[] = await valdForceDecksAPI.getTrials(test.testId);
                    let markedForUpsert: boolean = false;
                    if (!seenDays.CMJ.has(dayKey)) {
                        athlete.cmjTestCounter++;
                        if (athlete.cmjTestCounter === 2) {
                            markedForUpsert = true;
                        }
                        seenDays.CMJ.add(dayKey);
                        await prisma.athlete.update({
                            where: {
                                id: athlete.id,
                            },
                            data: {
                                cmjTestCounter: athlete.cmjTestCounter,
                            },
                        });
                    }
                    await storeCMJTest(trials, test.testId, markedForUpsert, athlete.playLevel);
                    break;
                }   
                case "SJ": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    let markedForUpsert: boolean = false;
                    if (!seenDays.SJ.has(dayKey)) {
                        athlete.sjTestCounter++;
                        if (athlete.sjTestCounter === 2) {
                            markedForUpsert = true;
                        }
                        seenDays.SJ.add(dayKey);
                        await prisma.athlete.update({
                            where: {
                                id: athlete.id,
                            },
                            data: {
                                sjTestCounter: athlete.sjTestCounter,
                            },
                        });
                    }
                    await storeSJTest(trials, test.testId, markedForUpsert, athlete.playLevel);
                    break;
                }
                case "HJ": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    let markedForUpsert: boolean = false;
                    if (!seenDays.HJ.has(dayKey)) {
                        athlete.hjTestCounter++;
                        if (athlete.hjTestCounter === 2) {
                            markedForUpsert = true;
                        }
                        seenDays.HJ.add(dayKey);
                        await prisma.athlete.update({
                            where: {
                                id: athlete.id,
                            },
                            data: {
                                hjTestCounter: athlete.hjTestCounter,
                            },
                        });
                    }
                    await storeHJTest(trials, test.testId, markedForUpsert, athlete.playLevel);
                    break;
                }
                case "PPU": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    let markedForUpsert: boolean = false;
                    if (!seenDays.PPU.has(dayKey)) {
                        athlete.ppuTestCounter++;
                        if (athlete.ppuTestCounter === 2) {
                            markedForUpsert = true;
                        }
                        seenDays.PPU.add(dayKey);
                        await prisma.athlete.update({
                            where: {
                                id: athlete.id,
                            },
                            data: {
                                ppuTestCounter: athlete.ppuTestCounter,
                            },
                        });
                    }
                    await storePPUTest(trials, test.testId, markedForUpsert, athlete.playLevel);
                    break;
                }
                case "IMTP": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    let markedForUpsert: boolean = false;
                    if (!seenDays.IMTP.has(dayKey)) {
                        athlete.imtpTestCounter++;
                        if (athlete.imtpTestCounter === 2) {
                            markedForUpsert = true;
                        }
                        seenDays.IMTP.add(dayKey);
                        await prisma.athlete.update({
                            where: {
                                id: athlete.id,
                            },
                            data: {
                                imtpTestCounter: athlete.imtpTestCounter,
                            },
                        });
                    }
                    await storeIMTPTest(trials, test.testId, markedForUpsert, athlete.playLevel);
                    break;
                }
                default: {
                    console.error(`Unsupported test type: ${test.testType}`);
                    break;
                }
            }
        }
        console.log("All tests synced successfully");
        await prisma.athlete.update({
            where: {
                id: athlete.id,
            },
            data: {
                forceplatesLatestSync: new Date(),
            },
        });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error syncing tests", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}