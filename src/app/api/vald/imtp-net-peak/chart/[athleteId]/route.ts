import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, context: { params: Promise<{ athleteId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { athleteId } = await context.params;
        if (!athleteId) {
            return NextResponse.json({ error: "Missing required parameter: athleteId" }, { status: 400 });
        }
        const imtpTests = await prisma.iMTPTest.findMany({
            where: {
                athleteId: athleteId,
            },
            orderBy: {
                recordedUTC: "asc",
            },
            select: {
                recordedUTC: true,
                NET_PEAK_VERTICAL_FORCE_trial_value: true,
                RELATIVE_STRENGTH_trial_value: true,
            },
        });
        return NextResponse.json({ netPeakStats: imtpTests });
    } catch (error) {
        console.error("Error fetching imtp net peak chart", error);
    }
}