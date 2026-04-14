import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  const db = getDb();

  if (week) {
    const weekStart = new Date(week);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const bookings = db
      .prepare(
        `SELECT b.id, b.user_id, u.username, b.start_time, b.end_time, b.created_at
         FROM bookings b JOIN users u ON b.user_id = u.id
         WHERE b.start_time < ? AND b.end_time > ?
         ORDER BY b.start_time`
      )
      .all(weekEnd.toISOString(), weekStart.toISOString());

    return NextResponse.json(bookings);
  }

  const bookings = db
    .prepare(
      `SELECT b.id, b.user_id, u.username, b.start_time, b.end_time, b.created_at
       FROM bookings b JOIN users u ON b.user_id = u.id
       ORDER BY b.start_time`
    )
    .all();

  return NextResponse.json(bookings);
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

  // Check for overlaps
  const overlap = db
    .prepare(
      `SELECT id FROM bookings
       WHERE start_time < ? AND end_time > ?`
    )
    .get(end.toISOString(), start.toISOString());

  if (overlap) {
    return NextResponse.json({ error: "This timeslot overlaps with an existing booking" }, { status: 409 });
  }

  const result = db
    .prepare("INSERT INTO bookings (user_id, start_time, end_time) VALUES (?, ?, ?)")
    .run(user.userId, start.toISOString(), end.toISOString());

  return NextResponse.json({
    id: result.lastInsertRowid,
    user_id: user.userId,
    username: user.username,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  });
}
