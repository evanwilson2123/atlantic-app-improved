import { clerkClient } from "@clerk/nextjs/server";

export async function isAdmin(userId: string): Promise<boolean> {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (!user) {
        return false;
    }
    const role = user.publicMetadata.role as string;
    return role === "ADMIN";
}

export async function isAthlete(userId: string): Promise<boolean> {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (!user) {
        return false;
    }
    const role = user.publicMetadata.role as string;
    return role === "ATHLETE";
}