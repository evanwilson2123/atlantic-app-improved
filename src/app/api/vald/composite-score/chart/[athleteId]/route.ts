import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAthlete, isAdmin } from "@/lib/roleChecks";
import { prisma } from "@/lib/db";
import path from "path";
import fs from "fs";

function percentRank(value: number, ref: Record<string, number>): number {
    if (!ref || typeof value !== 'number' || Number.isNaN(value)) return 0
    // Collect numeric percentile points from the ref object
    const points = Object.entries(ref)
        .map(([k, v]) => [Number(k), Number(v)] as [number, number])
        .filter(([p, v]) => Number.isFinite(p) && Number.isFinite(v))
    if (points.length === 0) return 0
    // Sort by value (ascending) so we can place the score among values
    points.sort((a, b) => a[1] - b[1])
    const first = points[0]
    const last = points[points.length - 1]
    if (value <= first[1]) return Math.max(0, Math.min(100, first[0]))
    if (value >= last[1]) return Math.max(0, Math.min(100, last[0]))
    // Find interval and linearly interpolate percent between the two points
    for (let i = 0; i < points.length - 1; i++) {
        const [p1, v1] = points[i]
        const [p2, v2] = points[i + 1]
        if (value >= v1 && value <= v2) {
            if (v2 === v1) return Math.max(0, Math.min(100, p2))
            const t = (value - v1) / (v2 - v1)
            const pr = p1 + t * (p2 - p1)
            return Math.max(0, Math.min(100, pr))
        }
    }
    return 0
}

function filterTests(tests: Array<{ recordedUTC: Date | string, testId: string }>) {
    if (!tests || tests.length === 0) return [] as string[]
    const first = tests[0]?.recordedUTC
    const baseTime = first instanceof Date ? first.getTime() : new Date(first as string).getTime()
    const dayMs = 1000 * 60 * 60 * 24
    const filteredTests: string[] = []
    for (const test of tests) {
        const t = test.recordedUTC
        const tTime = t instanceof Date ? t.getTime() : new Date(t as string).getTime()
        if (Math.abs(tTime - baseTime) < dayMs) filteredTests.push(test.testId)
    }
    return filteredTests
}

async function imtpCompositeData(testIds: string[]) {
    const imtpTests = await prisma.iMTPTest.findMany({
        where: {
            testId: {
                in: testIds,
            },
        },
    });
    for (const test of imtpTests) {
        console.log('net peak vertical force', test.NET_PEAK_VERTICAL_FORCE_trial_value);
        console.log('relative strength', test.RELATIVE_STRENGTH_trial_value);
    }
    // average netpeak vertical force
    if (imtpTests.length === 0) return { netPeakVerticalForce: 0, relativeStrength: 0 }
    const netPeakVerticalForce = imtpTests.reduce((acc, test) => acc + (test.NET_PEAK_VERTICAL_FORCE_trial_value || 0), 0) / imtpTests.length;
    // average relative strength
    const relativeStrength = imtpTests.reduce((acc, test) => acc + (test.RELATIVE_STRENGTH_trial_value || 0), 0) / imtpTests.length;
    return {
        netPeakVerticalForce: netPeakVerticalForce,
        relativeStrength: relativeStrength,
    }
}

async function ppuCompositeData(testIds: string[]) {
    const ppuTests = await prisma.pPUTest.findMany({
        where: {
            testId: {
                in: testIds,
            },
        },
    });
    for (const test of ppuTests) {
        console.log('peak takeoff force', test.PEAK_TAKEOFF_FORCE_trial_value);
    }
    // average bodymass relative mean takeoff force
    if (ppuTests.length === 0) return { peakTakeoffForce: 0 }
    // average peak takeoff force
    const peakTakeoffForce = ppuTests.reduce((acc, test) => acc + (test.PEAK_TAKEOFF_FORCE_trial_value || 0), 0) / ppuTests.length;
    return {
        peakTakeoffForce: peakTakeoffForce,
    }
}

async function sjCompositeData(testIds: string[]) {
    const sjTests = await prisma.sJTest.findMany({
        where: {
            testId: {
                in: testIds,
            },
        },
    });
    // average peak takeoff power
    if (sjTests.length === 0) return { peakTakeoffPower: 0 }
    for (const test of sjTests) {
        console.log('peak takeoff power', test.PEAK_TAKEOFF_POWER_trial_value);
        console.log('bodymass relative mean concentric power', test.BODYMASS_RELATIVE_TAKEOFF_POWER_trial_value);
    }
    const peakTakeoffPower = sjTests.reduce((acc, test) => acc + (test.PEAK_TAKEOFF_POWER_trial_value || 0), 0) / sjTests.length;
    // average bodymass relative mean concentric power
        const bodymassRelativeMeanConcentricPower = sjTests.reduce((acc, test) => acc + (test.BODYMASS_RELATIVE_TAKEOFF_POWER_trial_value  || 0), 0) / sjTests.length;
        return {
        peakTakeoffPower: peakTakeoffPower,
        bodymassRelativeMeanConcentricPower: bodymassRelativeMeanConcentricPower,
    }
}

async function hjCompositeData(testIds: string[]) {
    const hjTests = await prisma.hJTest.findMany({
        where: {
            testId: {
                in: testIds,
            },
        },
    });
    // average reactive strength index
    if (hjTests.length === 0) return { reactiveStrengthIndex: 0 }
    for (const test of hjTests) {
        console.log('reactive strength index', test.HOP_MEAN_RSI_trial_value);
    }
    const reactiveStrengthIndex = hjTests.reduce((acc, test) => acc + (test.HOP_MEAN_RSI_trial_value || 0), 0) / hjTests.length;
    return {
        reactiveStrengthIndex: reactiveStrengthIndex,
    }
}
export async function GET(req: NextRequest, context: { params: Promise<{ athleteId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAthlete(userId) || !isAdmin(userId)) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { athleteId } = await context.params;
    if (!athleteId) {
        console.error("Missing required parameter: athleteId");
    }
    try {
        const imtpTests = await prisma.iMTPTest.findMany({
            where: {
                athleteId: athleteId,
            },
            orderBy: {
                recordedUTC: "desc",
            },
            select: {
                recordedUTC: true,
                testId: true,
            },
        });
        const ppuTests = await prisma.pPUTest.findMany({
            where: {
                athleteId: athleteId,
            },
            orderBy: {
                recordedUTC: "desc",
            },
            select: {
                recordedUTC: true,
                testId: true,
            },
        });
        const sjTests = await prisma.sJTest.findMany({
            where: {
                athleteId: athleteId,
            },
            orderBy: {
                recordedUTC: "desc",
            },
            select: {
                recordedUTC: true,
                testId: true,
            },
        });
        const hjTests = await prisma.hJTest.findMany({
            where: {
                athleteId: athleteId,
            },
            orderBy: {
                recordedUTC: "desc",
            },
            select: {
                recordedUTC: true,
                testId: true,
            },
        });

        console.log(JSON.stringify(imtpTests, null, 2));
        console.log(JSON.stringify(ppuTests, null, 2));
        console.log(JSON.stringify(sjTests, null, 2));
        console.log(JSON.stringify(hjTests, null, 2));
        
        const imtpFilteredTests = filterTests(imtpTests);
        const ppuFilteredTests = filterTests(ppuTests);
        const sjFilteredTests = filterTests(sjTests);
        const hjFilteredTests = filterTests(hjTests);

        const imtpComposite = await imtpCompositeData(imtpFilteredTests);
        const ppuComposite = await ppuCompositeData(ppuFilteredTests);
        const sjComposite = await sjCompositeData(sjFilteredTests);
        const hjComposite = await hjCompositeData(hjFilteredTests);
        
        // calculate percentiles based on json file in public/hp_obp_percentiles.json
        const percentiles = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "public", "hp_obp_percentiles.json"), "utf8"));
        const imtpNetPeakRef = percentiles["net_peak_vertical_force_[n]_max_imtp"] as Record<string, number>;
        const imtpRelStrengthRef = percentiles["relative_strength"] as Record<string, number>;
        const ppuPeakForceRef = percentiles["peak_takeoff_force_[n]_mean_pp"] as Record<string, number>;
        const sjBodyMassRelativeMeanTakeoffForceRef = percentiles["peak_power_/_bm_[w/kg]_mean_sj"] as Record<string, number>;
        const sjPeakPowerRef = percentiles["peak_power_[w]_mean_sj"] as Record<string, number>;
        const hjRsiRef = percentiles["best_rsi_(flight/contact_time)_mean_ht"] as Record<string, number>; // RSI

        const netPeakVerticalForcePercentile = percentRank(imtpComposite.netPeakVerticalForce, imtpNetPeakRef)
        const relativeStrengthPercentile = percentRank(imtpComposite.relativeStrength, imtpRelStrengthRef)
        // No BW-relative power reference present for PPU in the JSON
        const peakTakeoffForcePercentile = percentRank(ppuComposite.peakTakeoffForce, ppuPeakForceRef)
        const bodyMassRelativeMeanTakeoffForcePercentile = percentRank(sjComposite.bodymassRelativeMeanConcentricPower!, sjBodyMassRelativeMeanTakeoffForceRef)
        const peakTakeoffPowerPercentile = percentRank(sjComposite.peakTakeoffPower, sjPeakPowerRef)
        const reactiveStrengthIndexPercentile = percentRank(hjComposite.reactiveStrengthIndex, hjRsiRef)
        
        return NextResponse.json({
            impt_net_peak_vertical_force: netPeakVerticalForcePercentile,
            relative_strength_imtp: relativeStrengthPercentile,
            peak_power_ppu: peakTakeoffForcePercentile,
            sj_peak_power_w: peakTakeoffPowerPercentile,
            sj_peak_power_w_bw: bodyMassRelativeMeanTakeoffForcePercentile,
            reactive_strength_index_hj: reactiveStrengthIndexPercentile,
        });
    } catch (error) {
        console.error("Error fetching composite score chart", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}