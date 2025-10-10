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
        const valdForceDecksAPI = new SimpleVALDForceDecksAPI();
        const modifiedFromUtc = await getLatestTests(profileId);
        let tests: VALDTest[] = [];
        if (!modifiedFromUtc) {
            const resp = await valdForceDecksAPI.getTests(new Date(0).toISOString(), profileId);
            tests = resp?.tests ?? [];
        } else {
            tests = (await valdForceDecksAPI.getUnsyncedTests(profileId, modifiedFromUtc.toISOString())) ?? [];
        }
        console.log(`Found ${tests.length} tests to sync`);
        if (tests.length === 0) {
            console.log("No tests to sync");
            return NextResponse.json({ success: true }, { status: 200 });
        }
        for (const test of tests) {
            console.log(`Syncing test: ${test.testType}`);
            switch (test.testType) {
                case "CMJ": {
                    const trials: Trial[] = await valdForceDecksAPI.getTrials(test.testId);
                    await storeCMJTest(trials, test.testId);
                    break;
                }   
                case "SJ": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    await storeSJTest(trials, test.testId);
                    break;
                }
                case "HJ": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    await storeHJTest(trials, test.testId);
                    break;
                }
                case "PPU": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    await storePPUTest(trials, test.testId);
                    break;
                }
                case "IMTP": {
                    const trials = await valdForceDecksAPI.getTrials(test.testId);
                    await storeIMTPTest(trials, test.testId);
                    break;
                }
                default: {
                    console.error(`Unsupported test type: ${test.testType}`);
                    break;
                }
            }
        }
        console.log("All tests synced successfully");
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error syncing tests", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}