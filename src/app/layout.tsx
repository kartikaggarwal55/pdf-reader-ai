import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Reader AI",
  description: "Read PDFs with AI-powered explanations",
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
