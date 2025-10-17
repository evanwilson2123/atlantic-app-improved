import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { LatestTechsResponse } from "@/types/types";

async function getLatestValdTest(athleteId: string): Promise<Date | undefined> {
    const cmjTest = await prisma.cMJTest.findFirst({
        where: {
            athleteId
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
            athleteId
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
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
        },
    })
    const ppuTest = await prisma.pPUTest.findFirst({
        where: {
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
        },
    });
    const imtpTest = await prisma.iMTPTest.findFirst({
        where: {
            athleteId
        },
        orderBy: {
            recordedUTC: "desc",
        },
        select: {
            recordedUTC: true,
        },
    });
    const latestTests = [cmjTest, sjTest, hjTest, ppuTest, imtpTest];
    const latestDate = latestTests
        .map(test => test?.recordedUTC)
        .filter((d): d is Date => d instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())
        .at(-1);
    return latestDate;
}

export async function GET(req: NextRequest, context: { params: Promise<{ athleteId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized Request" }, { status: 401 });
    }
    try {
        const { athleteId } = await context.params;
        if (!athleteId) {
            console.error("Missing required parameter: athleteId");
            return NextResponse.json({ error: "Missing required parameter: athleteId" }, { status: 400 });
        }
        // profileId
        const athlete = await prisma.athlete.findUnique({
            where: {
                id: parseInt(athleteId),
            },
            select: {
                profileId: true,
            },
        });
        if (!athlete) {
            console.error("Athlete not found");
            return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
        }
        if (athlete.profileId === "") {
            console.error("Athlete has no profileId");
            return NextResponse.json({ error: "Athlete has no profileId" }, { status: 400 });
        }
        // latest vald test
        const latestValdDate = await getLatestValdTest(athlete.profileId);
        console.log("latestValdDate", latestValdDate);

        const response: LatestTechsResponse = {
            vald: latestValdDate,
            blast: undefined,
            trackman: undefined,
            hittrax: undefined,
        };
        return NextResponse.json({ latestTechs: response }, { status: 200 });
    } catch (error) {
        console.error("Error fetching latest techs", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}