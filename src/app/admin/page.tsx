"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; isAdmin: boolean } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
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
        if (data) {
          if (!data.isAdmin) {
            router.push("/");
            return;
          }
          setCurrentUser(data);
        }
        setLoading(false);
      });
  }, [router]);

  const fetchUsers = useCallback(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [currentUser, fetchUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(`User "${data.username}" created successfully`);
    setUsername("");
    setPassword("");
    fetchUsers();
  }

  async function handleDeleteUser(id: number, name: string) {
    if (!confirm(`Delete user "${name}"? This will also delete all their bookings.`)) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    fetchUsers();
  }

  async function handleResetPassword(id: number) {
    if (!resetPassword || resetPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess("Password reset successfully");
    setResetPasswordId(null);
    setResetPassword("");
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

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Booking
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Logged in as <span className="font-medium text-gray-900">{currentUser.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Create User Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="new-username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="new-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                minLength={2}
                maxLength={20}
                placeholder="Enter username"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                minLength={4}
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Create User
            </button>
          </form>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
          {success && <p className="mt-3 text-green-600 text-sm">{success}</p>}
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Users ({users.length})
          </h2>
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{u.username}</span>
                  {u.is_admin ? (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  ) : null}
                  <span className="ml-3 text-sm text-gray-500">
                    Created {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {resetPasswordId === u.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="New password"
                        minLength={4}
                      />
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setResetPasswordId(null); setResetPassword(""); }}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50 text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResetPasswordId(u.id)}
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      Reset Password
                    </button>
                  )}
                  {!u.is_admin && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
