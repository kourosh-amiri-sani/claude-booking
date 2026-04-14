import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Booking",
  description: "Coordinate Claude usage across your team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
