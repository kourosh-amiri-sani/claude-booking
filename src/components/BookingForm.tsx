"use client";

import { useState } from "react";

interface BookingFormProps {
  onSubmit: (start: string, end: string) => void;
  onClose: () => void;
  initialStart?: string;
  initialEnd?: string;
  error?: string;
}

export default function BookingForm({ onSubmit, onClose, initialStart, initialEnd, error }: BookingFormProps) {
  const [startDate, setStartDate] = useState(initialStart?.slice(0, 10) || "");
  const [startTime, setStartTime] = useState(initialStart ? new Date(initialStart).toTimeString().slice(0, 5) : "09:00");
  const [endTime, setEndTime] = useState(initialEnd ? new Date(initialEnd).toTimeString().slice(0, 5) : "10:00");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${startDate}T${endTime}:00`);
    onSubmit(start.toISOString(), end.toISOString());
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Book a Timeslot</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="900"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="900"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
