import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function POST(request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { error: "Authorization token required" },
                { status: 401 }
            );
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decoded.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {

                isPremium: true,

            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        await prisma.user.update({
            where: { id: userId },
            data: { isPremium: true },
        });
        return NextResponse.json({ message: "User upgraded to Premium successfully" });


    } catch (error) {
        console.error("❌ Error fetching completed interviews:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }

}