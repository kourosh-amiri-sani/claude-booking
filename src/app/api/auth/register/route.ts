import { NextResponse } from "next/server";

// Registration is disabled. Users are created by admins via /api/admin/users
export async function POST() {
  return NextResponse.json(
    { error: "Registration is disabled. Contact your administrator." },
    { status: 403 }
  );
}
