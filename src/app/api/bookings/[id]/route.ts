import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const bookingId = parseInt(params.id);
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const db = getDb();
  await initDb();

  const result = await db.execute({ sql: "SELECT id, user_id FROM bookings WHERE id = ?", args: [bookingId] });
  const booking = result.rows[0];

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (Number(booking.user_id) !== user.userId) {
    return NextResponse.json({ error: "You can only cancel your own bookings" }, { status: 403 });
  }

  await db.execute({ sql: "DELETE FROM bookings WHERE id = ?", args: [bookingId] });

  return NextResponse.json({ ok: true });
}
