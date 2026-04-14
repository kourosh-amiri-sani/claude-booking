"use client";

import { Booking } from "@/types";

interface NavbarProps {
  username: string;
  isAdmin: boolean;
  bookings: Booking[];
  onLogout: () => void;
}

export default function Navbar({ username, isAdmin, bookings, onLogout }: NavbarProps) {
  const now = new Date();
  const currentBooking = bookings.find((b) => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    return now >= start && now < end;
  });

  return (
    <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-900">Claude Booking</h1>
        <div className="text-sm">
          {currentBooking ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              In use by <span className="font-semibold">{currentBooking.username}</span> until{" "}
              {new Date(currentBooking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Available
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          Logged in as <span className="font-medium text-gray-900">{username}</span>
        </span>
        {isAdmin && (
          <a
            href="/admin"
            className="px-3 py-1 text-sm border border-purple-300 text-purple-700 rounded hover:bg-purple-50 transition-colors"
          >
            Admin
          </a>
        )}
        <button
          onClick={onLogout}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
