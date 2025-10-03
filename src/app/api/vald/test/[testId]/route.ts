import { SimpleVALDForceDecksAPI, VALDTrial } from "@/lib/forcedecks-api";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Trial } from "@/types/types";
import { storeHJTest, storeIMTPTest, storePPUTest, storeSJTest } from "@/lib/storeTest";

export async function GET(req: NextRequest, context: { params: Promise<{ testId: string }> }) {
    // const { userId } = await auth();
    // if (!userId) {
    //     console.error("Unauthorized Request");
    //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    const { testId } = await context.params;
    if (!testId) {
        console.error("Missing required parameter: testId");
        return NextResponse.json({ error: "Missing required parameter: testId" }, { status: 400 });
    }
    try {
        const valdForceDecksAPI = new SimpleVALDForceDecksAPI();
        const test: Trial[] = await valdForceDecksAPI.getTrials(testId);
        // const stored = await storeIMTPTest(test);
        // if (!stored) {
        //     console.error("Error storing test", test);
        //     return NextResponse.json({ error: "Error storing test" }, { status: 500 });
        // }
        return NextResponse.json({ test: test }, { status: 200 });
    } catch (error) {
        console.error("Error fetching vald test", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}