import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { isAthlete, isAdmin } from "@/lib/roleChecks";
import { SimpleVALDForceDecksAPI } from "@/lib/forcedecks-api";


export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAthlete(userId) || !isAdmin(userId)) {
        console.error("Unauthorized Request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    if (!profileId) {
        console.error("Missing required parameter: profileId");
        return NextResponse.json({ error: "Missing required parameter: profileId" }, { status: 400 });
    }
    try {
        console.log("profileId", profileId);
        const valdForceDecksAPI = new SimpleVALDForceDecksAPI();
        const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        const tests = await valdForceDecksAPI.getTests(oneYearAgo.toISOString(), profileId);
        console.log(tests);
        return NextResponse.json({ tests: tests }, { status: 200 });
    } catch (error) {
        console.error("Error fetching vald profile", error);
        console.error("Error fetching vald profile");
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}