import { prisma } from "@/lib/db";
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
        return NextResponse.json({ athlete }, { status: 200 });

    } catch (error) {
        console.error("Error fetching athlete profile", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}