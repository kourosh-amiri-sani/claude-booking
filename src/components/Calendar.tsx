"use client";

import { useState, useMemo } from "react";
import { Booking } from "@/types";

interface CalendarProps {
  bookings: Booking[];
  currentUserId: number;
  onCreateBooking: (start: string, end: string) => void;
  onDeleteBooking: (id: number) => void;
  weekStart: Date;
  onWeekChange: (date: Date) => void;
}

const HOURS_START = 6;
const HOURS_END = 24;
const SLOT_HEIGHT = 48; // px per hour

const USER_COLORS = [
  "bg-blue-200 border-blue-400 text-blue-900",
  "bg-green-200 border-green-400 text-green-900",
  "bg-purple-200 border-purple-400 text-purple-900",
  "bg-orange-200 border-orange-400 text-orange-900",
  "bg-pink-200 border-pink-400 text-pink-900",
  "bg-teal-200 border-teal-400 text-teal-900",
  "bg-yellow-200 border-yellow-400 text-yellow-900",
  "bg-red-200 border-red-400 text-red-900",
];

function hashUsername(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash + username.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getColorForUser(username: string): string {
  return USER_COLORS[hashUsername(username) % USER_COLORS.length];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Calendar({
  bookings,
  currentUserId,
  onCreateBooking,
  onDeleteBooking,
  weekStart,
  onWeekChange,
}: CalendarProps) {
  const [selecting, setSelecting] = useState<{ dayIndex: number; startHour: number } | null>(null);
  const [selectEnd, setSelectEnd] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOURS_START; i < HOURS_END; i++) h.push(i);
    return h;
  }, []);

  function handleMouseDown(dayIndex: number, hour: number) {
    setSelecting({ dayIndex, startHour: hour });
    setSelectEnd(hour + 1);
    setSelectedBooking(null);
  }

  function handleMouseMove(hour: number) {
    if (selecting) {
      setSelectEnd(Math.max(selecting.startHour + 1, hour + 1));
    }
  }

  function handleMouseUp() {
    if (selecting && selectEnd !== null) {
      const day = days[selecting.dayIndex];
      const start = new Date(day);
      start.setHours(selecting.startHour, 0, 0, 0);
      const end = new Date(day);
      end.setHours(selectEnd, 0, 0, 0);
      onCreateBooking(start.toISOString(), end.toISOString());
    }
    setSelecting(null);
    setSelectEnd(null);
  }

  function getBookingsForDay(dayIndex: number): Booking[] {
    const day = days[dayIndex];
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return bStart < dayEnd && bEnd > dayStart;
    });
  }

  function getBookingStyle(booking: Booking, day: Date) {
    const bStart = new Date(booking.start_time);
    const bEnd = new Date(booking.end_time);
    const dayStart = new Date(day);
    dayStart.setHours(HOURS_START, 0, 0, 0);

    const startOffset = Math.max(0, (bStart.getTime() - dayStart.getTime()) / (1000 * 60 * 60));
    const endOffset = Math.min(HOURS_END - HOURS_START, (bEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60));
    const duration = endOffset - startOffset;

    return {
      top: `${startOffset * SLOT_HEIGHT}px`,
      height: `${duration * SLOT_HEIGHT}px`,
    };
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    onWeekChange(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    onWeekChange(d);
  }

  function goToday() {
    onWeekChange(getMonday(new Date()));
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <button onClick={prevWeek} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700">
          &larr; Prev
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {weekStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <button onClick={goToday} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700">
            Today
          </button>
        </div>
        <button onClick={nextWeek} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700">
          Next &rarr;
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-[800px]">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r bg-gray-50">
            <div className="h-10 border-b" /> {/* Header spacer */}
            {hours.map((hour) => (
              <div key={hour} className="border-b text-xs text-gray-500 text-right pr-2" style={{ height: SLOT_HEIGHT }}>
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const dayBookings = getBookingsForDay(dayIndex);

            return (
              <div key={dayIndex} className="flex-1 border-r last:border-r-0 min-w-[100px]">
                {/* Day header */}
                <div
                  className={`h-10 border-b flex flex-col items-center justify-center text-sm ${
                    isToday ? "bg-blue-50 font-bold text-blue-700" : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{dayNames[dayIndex]}</span>
                  <span className="text-xs">{day.getDate()}</span>
                </div>

                {/* Hour slots */}
                <div className="relative" onMouseUp={handleMouseUp}>
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-gray-100 cursor-pointer hover:bg-blue-50/30"
                      style={{ height: SLOT_HEIGHT }}
                      onMouseDown={() => handleMouseDown(dayIndex, hour)}
                      onMouseMove={() => handleMouseMove(hour)}
                    />
                  ))}

                  {/* Selection overlay */}
                  {selecting && selecting.dayIndex === dayIndex && selectEnd !== null && (
                    <div
                      className="absolute left-1 right-1 bg-blue-100 border-2 border-blue-400 border-dashed rounded opacity-70 pointer-events-none z-10"
                      style={{
                        top: `${(selecting.startHour - HOURS_START) * SLOT_HEIGHT}px`,
                        height: `${(selectEnd - selecting.startHour) * SLOT_HEIGHT}px`,
                      }}
                    />
                  )}

                  {/* Booking blocks */}
                  {dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`absolute left-1 right-1 rounded border px-1.5 py-0.5 text-xs cursor-pointer overflow-hidden z-20 ${getColorForUser(
                        booking.username
                      )} ${selectedBooking?.id === booking.id ? "ring-2 ring-blue-600" : ""}`}
                      style={getBookingStyle(booking, day)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(selectedBooking?.id === booking.id ? null : booking);
                      }}
                    >
                      <div className="font-semibold truncate">{booking.username}</div>
                      <div className="truncate">
                        {formatTime(new Date(booking.start_time))} - {formatTime(new Date(booking.end_time))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected booking info */}
      {selectedBooking && (
        <div className="border-t bg-white px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{selectedBooking.username}</span>
            {" — "}
            {new Date(selectedBooking.start_time).toLocaleString()} to{" "}
            {new Date(selectedBooking.end_time).toLocaleTimeString()}
          </div>
          {selectedBooking.user_id === currentUserId && (
            <button
              onClick={() => {
                onDeleteBooking(selectedBooking.id);
                setSelectedBooking(null);
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Cancel Booking
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { getMonday };
