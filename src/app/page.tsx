"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Calendar, { getMonday } from "@/components/Calendar";
import BookingForm from "@/components/BookingForm";
import Navbar from "@/components/Navbar";
import { Booking } from "@/types";

export default function Home() {
  const [user, setUser] = useState<{ id: number; username: string; isAdmin: boolean } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [formStart, setFormStart] = useState<string | undefined>();
  const [formEnd, setFormEnd] = useState<string | undefined>();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
        setLoading(false);
      });
  }, [router]);

  const fetchBookings = useCallback(() => {
    const weekParam = weekStart.toISOString().slice(0, 10);
    fetch(`/api/bookings?week=${weekParam}`)
      .then((res) => res.json())
      .then(setBookings);
  }, [weekStart]);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  // Refresh bookings every 30 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [user, fetchBookings]);

  async function handleCreateBooking(start: string, end: string) {
    setFormStart(start);
    setFormEnd(end);
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmitBooking(start: string, end: string) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_time: start, end_time: end }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error);
      return;
    }

    setShowForm(false);
    fetchBookings();
  }

  async function handleDeleteBooking(id: number) {
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    fetchBookings();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col">
      <Navbar username={user.username} isAdmin={user.isAdmin} bookings={bookings} onLogout={handleLogout} />
      <div className="flex-1 overflow-hidden">
        <Calendar
          bookings={bookings}
          currentUserId={user.id}
          onCreateBooking={handleCreateBooking}
          onDeleteBooking={handleDeleteBooking}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
        />
      </div>
      {showForm && (
        <BookingForm
          onSubmit={handleSubmitBooking}
          onClose={() => setShowForm(false)}
          initialStart={formStart}
          initialEnd={formEnd}
          error={formError}
        />
      )}
    </div>
  );
}
