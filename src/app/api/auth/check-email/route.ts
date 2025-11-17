import { userEmailExists } from "@/services/users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    const exists = await userEmailExists(email);

    return NextResponse.json({ ok: true, exists });
  } catch (err) {
    console.error("[check-email] error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
