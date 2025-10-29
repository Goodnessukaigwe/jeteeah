import type { Metadata } from "next";
import { Space_Grotesk, Raleway } from "next/font/google";
import "./globals.css";
import { GameProvider } from "./contexts/GameContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "JETEEAH",
  description: "A mobile-first snake game UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${raleway.variable} flex justify-center items-center min-h-screen bg-[#1E293B] text-white`}
      >
        <GameProvider>
          <div className="w-[395px] max-w-full h-[630px]  shadow-lg overflow-hidden font-sans">
            {children}
          </div>
        </GameProvider>
      </body>
    </html>
  );
}
