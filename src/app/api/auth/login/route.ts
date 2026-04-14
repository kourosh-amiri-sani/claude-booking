import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare("SELECT id, username, password FROM users WHERE username = ?").get(username) as
    | { id: number; username: string; password: string }
    | undefined;

  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = signToken(user.id, user.username);
  await setAuthCookie(token);

  return NextResponse.json({ id: user.id, username: user.username });
}
