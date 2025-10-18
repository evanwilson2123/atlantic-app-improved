import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAthlete, isAdmin } from "@/lib/roleChecks";
import { prisma } from "@/lib/db"


export async function GET(req: NextRequest, context: { params: Promise<{ profileId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAthlete(userId) || !isAdmin(userId)) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profileId } = await context.params;
    if (!profileId) {
        console.error("Missing required parameter: profileId");
        return NextResponse.json({ error: "Missing required parameter: profileId" }, { status: 400 });
    }
    try {
        const sjTests = await prisma.sJTest.findMany({
            where: {
                athleteId: profileId,
            },
            orderBy: {
                recordedUTC: "desc",
            },
            select: {
                recordedUTC: true,
                BODYMASS_RELATIVE_TAKEOFF_POWER_trial_value: true,
                PEAK_TAKEOFF_POWER_trial_value: true,
            },
        })
        return NextResponse.json({ sjTests: sjTests }, { status: 200 });
    } catch (error) {
        console.error("Error fetching sj chart", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}