import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_KR, Press_Start_2P } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press", display: "swap" });
const plex = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-plex", display: "swap", preload: false });
const galmuri = localFont({
  src: [
    { path: "./fonts/Galmuri11.woff2", weight: "400" },
    { path: "./fonts/Galmuri11-Bold.woff2", weight: "700" },
  ],
  variable: "--font-galmuri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "박규원의 가족여행",
  description: "우리 가족 여행 일정, 장소, 준비물, 경비를 한곳에서",
  appleWebApp: { capable: true, title: "가족여행", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${press.variable} ${plex.variable} ${galmuri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
