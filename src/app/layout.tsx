import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoTrack AI",
  description: "Track carbon activity and get personalized sustainability insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
