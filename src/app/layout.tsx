import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import { OfflineOverlay } from "@/components/dashboard/offline-overlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediCare - Sistem Cabinet Stomatologic",
  description: "Aplica'ie de gestiune pentru Cabinet Stomatologic",
};
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={`${poppins.variable} ${geistMono.variable} antialiased`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
        <OfflineOverlay />
      </body>
    </html>
  )
}
