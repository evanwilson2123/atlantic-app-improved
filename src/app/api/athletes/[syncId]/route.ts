import { ValdProfileApi } from "@/lib/valdProfileApi";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ syncId: string }>} ) {
    const { syncId } = await context.params;
    if (!syncId) {
        return NextResponse.json({ error: "Missing required syncId" }, { status: 400 });
    } 
    try {
        const valdProfileApi = new ValdProfileApi();
        const profileId = await valdProfileApi.getAthlete(syncId);
        if (!profileId) {
            return NextResponse.json({ error: "Failed to get athlete" }, { status: 500 });
        }
        console.log('profileId', profileId);
        return NextResponse.json({ profileId: profileId }, { status: 200 });
    } catch (error) {
        console.error('Error getting athlete', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}