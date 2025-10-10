import { prisma } from "@/lib/db";
import { ValdProfileApi } from "@/lib/valdProfileApi";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ athleteId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {   
        const { athleteId } = await context.params;
        if (!athleteId) {
            console.error("Missing required parameter: athleteId");
            return NextResponse.json({ error: "Missing required parameter: athleteId" }, { status: 400 });
        }
        const athlete = await prisma.athlete.findUnique({
            where: {
                id: parseInt(athleteId),
            }
        });
        if (!athlete) {
            console.error("Athlete not found");
            return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
        }
        if (athlete.profileId === "") {
            const valdProfileApi = new ValdProfileApi();
            const profileId = await valdProfileApi.getAthlete(athlete.syncId);
            if (!profileId) {
                console.error("Failed to get profileId");
                return NextResponse.json({ error: "Failed to get profileId" }, { status: 500 });
            }
            athlete.profileId = profileId;
            await prisma.athlete.update({
                where: {
                    id: parseInt(athleteId),
                },
                data: {
                    profileId: profileId,
                },
            });
        }
        return NextResponse.json({ athlete }, { status: 200 });

    } catch (error) {
        console.error("Error fetching athlete profile", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}