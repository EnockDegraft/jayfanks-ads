import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jay Fanks — Hair and Skin Care",
  description:
    "Discover Jay Fanks natural hair and skin care, including Mmofra hair products and body butter."
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
