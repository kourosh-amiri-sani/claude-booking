import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, initDb } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const db = getDb();
  await initDb();

  const result = await db.execute({ sql: "SELECT id, username, password, is_admin FROM users WHERE username = ?", args: [username] });
  const user = result.rows[0];

  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password as string);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const isAdmin = Boolean(user.is_admin);
  const token = signToken(Number(user.id), user.username as string, isAdmin);
  await setAuthCookie(token);

  return NextResponse.json({ id: user.id, username: user.username, isAdmin });
}
