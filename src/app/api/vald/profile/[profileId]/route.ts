import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface TestType {
    type: "CMJ" | "SJ" | "HJ" | "PP" | "IMTP";
    testId: string;
    recordedUTC: Date;
}

interface ValdProfileResponse {
    cmjTest: TestType;
    sjTest: TestType;
    hjTest: TestType;
    ppTest: TestType;
    imtpTest: TestType;
}

async function fetchTestTypes(athleteId: string): Promise<ValdProfileResponse> {
    const cmjTest = await prisma.cMJTest.findMany({
        where: {
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
            testId: true,
        },
        take: 1,
    });
    const sjTest = await prisma.sJTest.findMany({
        where: {
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
            testId: true,
        },
        take: 1,
    });
    const hjTest = await prisma.hJTest.findMany({
        where: {
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
            testId: true,
        },
        take: 1,
    });
    const ppTest = await prisma.pPUTest.findMany({
        where: {
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
            testId: true,
        },
        take: 1,
    });
    const imtpTest = await prisma.iMTPTest.findMany({
        where: {
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
            testId: true,
        },
        take: 1,
    });
    return {
        cmjTest: {
            type: "CMJ",
            testId: cmjTest[0]?.testId,
            recordedUTC: cmjTest[0]?.recordedUTC,
        },
        sjTest: {
            type: "SJ",
            testId: sjTest[0]?.testId,
            recordedUTC: sjTest[0]?.recordedUTC,
        },
        hjTest: {
            type: "HJ",
            testId: hjTest[0]?.testId,
            recordedUTC: hjTest[0]?.recordedUTC,
        },
        ppTest: {
            type: "PP",
            testId: ppTest[0]?.testId,
            recordedUTC: ppTest[0]?.recordedUTC,
        },
        imtpTest: {
            type: "IMTP",
            testId: imtpTest[0]?.testId,
            recordedUTC: imtpTest[0]?.recordedUTC,
        },
    };
}

export async function GET(req: NextRequest, context: { params: Promise<{ profileId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
        const { profileId } = await context.params;
    if (!profileId) {
        console.error("Missing required parameter: profileId");
        return NextResponse.json({ error: "Missing required parameters: profileId" }, { status: 400 });
    }
    try {
        const profileResponse = await fetchTestTypes(profileId);
        if (!profileResponse) {
            console.error("Failed to fetch test types");
            return NextResponse.json({ error: "Failed to fetch test types" }, { status: 500 });
        }
        return NextResponse.json({ profileResponse }, { status: 200 });
    } catch (error) {
        console.error("Error fetching vald profile", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}