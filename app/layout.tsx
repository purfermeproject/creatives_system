import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creative OS",
  description: "AI static-ad creative operating system"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
