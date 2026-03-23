import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Macro Dashboard",
  description: "Macro regime analysis cockpit for market diagnosis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
