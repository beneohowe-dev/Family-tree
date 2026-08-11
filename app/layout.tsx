import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motion Community OS",
  description: "Private relationship intelligence for Motion and Motion Foundation.",
  applicationName: "Motion Community OS",
  appleWebApp: {
    capable: true,
    title: "Motion OS",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101725"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
