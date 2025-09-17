import { SimpleVALDForceDecksAPI } from "@/lib/forcedecks-api";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ testId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { testId } = await context.params;
    if (!testId) {
        console.error("Missing required parameter: testId");
        return NextResponse.json({ error: "Missing required parameter: testId" }, { status: 400 });
    }
    try {
        const valdForceDecksAPI = new SimpleVALDForceDecksAPI();
        const test = await valdForceDecksAPI.getTrials(testId);
        console.log(test);
        return NextResponse.json({ test: test }, { status: 200 });
    } catch (error) {
        console.error("Error fetching vald test", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}