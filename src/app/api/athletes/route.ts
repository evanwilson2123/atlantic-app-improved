import { NextRequest, NextResponse } from "next/server";
import { ValdProfileApi } from "@/lib/valdProfileApi";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from 'uuid';
import { isAdmin } from "@/lib/roleChecks";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(userId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { firstName, lastName, email, dob, sex, playLevel, password } = body;
        if (!firstName || !lastName || !email || !dob || !sex || !playLevel || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const syncId = uuidv4();
        const externalId = uuidv4();
        const valdProfileApi = new ValdProfileApi();
        const status = await valdProfileApi.createAthlete({
            dateOfBirth: new Date(dob),
            email,
            givenName: firstName,
            familyName: lastName,
            sex,
            syncId: syncId,
            externalId: externalId,
        });
        console.log('status', status);
        const profileId = await valdProfileApi.getAthlete(syncId);
        console.log('profileId', profileId);
        if (!profileId) {
            return NextResponse.json({ error: "Failed to create athlete" }, { status: 500 });
        }
        const created = await prisma.athlete.create({
            data: {
                dob: new Date(dob),
                email,
                firstName,
                lastName,
                sex,
                externalId,
                profileId: profileId ?? "",
                syncId,
                syncedAt: new Date(),
                activeStatus: true,
                playLevel,
            },
        });
        return NextResponse.json({ athlete: created }, { status: 201 });
    } catch (error) {
        console.error('Error creating athlete:', error);
        return NextResponse.json({ error: "Failed to create athlete" }, { status: 500 });
    }
}

export async function GET(_req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        console.error("Unauthorized");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(userId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const athletes = await prisma.athlete.findMany();
        return NextResponse.json({ athletes }, { status: 200 });
    } catch (error) {
        console.error('Error fetching athletes:', error);
        return NextResponse.json({ error: "Failed to fetch athletes" }, { status: 500 });
    }
}


