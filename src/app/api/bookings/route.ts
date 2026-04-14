import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  const db = getDb();
  await initDb();

  if (week) {
    const weekStart = new Date(week);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const result = await db.execute({
      sql: `SELECT b.id, b.user_id, u.username, b.start_time, b.end_time, b.created_at
            FROM bookings b JOIN users u ON b.user_id = u.id
            WHERE b.start_time < ? AND b.end_time > ?
            ORDER BY b.start_time`,
      args: [weekEnd.toISOString(), weekStart.toISOString()],
    });

    return NextResponse.json(result.rows);
  }

  const result = await db.execute({
    sql: `SELECT b.id, b.user_id, u.username, b.start_time, b.end_time, b.created_at
          FROM bookings b JOIN users u ON b.user_id = u.id
          ORDER BY b.start_time`,
    args: [],
  });

  return NextResponse.json(result.rows);
}

function snapTo15Min(date: Date): Date {
  const minutes = Math.round(date.getMinutes() / 15) * 15;
  date.setMinutes(minutes, 0, 0);
  return date;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { start_time, end_time } = await request.json();

  if (!start_time || !end_time) {
    return NextResponse.json({ error: "start_time and end_time are required" }, { status: 400 });
  }

  const start = snapTo15Min(new Date(start_time));
  const end = snapTo15Min(new Date(end_time));

  if (start >= end) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const db = getDb();
  await initDb();

  const overlap = await db.execute({
    sql: "SELECT id FROM bookings WHERE start_time < ? AND end_time > ?",
    args: [end.toISOString(), start.toISOString()],
  });

  if (overlap.rows.length > 0) {
    return NextResponse.json({ error: "This timeslot overlaps with an existing booking" }, { status: 409 });
  }

  const result = await db.execute({
    sql: "INSERT INTO bookings (user_id, start_time, end_time) VALUES (?, ?, ?)",
    args: [user.userId, start.toISOString(), end.toISOString()],
  });

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    user_id: user.userId,
    username: user.username,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  });
}
