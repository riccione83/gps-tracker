"use client";

import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          margin: 0,
          height: "calc(100vh)",
          // width: "100vw",
          overflow: "scroll",
        }}
      >
        {children}
      </body>
    </html>
  );
}
