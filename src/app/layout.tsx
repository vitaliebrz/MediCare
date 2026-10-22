import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import { OfflineOverlay } from "@/components/dashboard/offline-overlay";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediCare - Sistem Cabinet Stomatologic",
  description: "Aplicație de gestiune pentru Cabinet Stomatologic",
  applicationName: "MediCare",
  // iPhone: aplicația adăugată pe ecranul principal se deschide fără bara Safari.
  // Iconița vine din src/app/apple-icon.png, manifestul din src/app/manifest.ts.
  appleWebApp: { capable: true, title: "MediCare", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Bara de stare a telefonului (ceas, baterie) are aceeași culoare ca bara de sus a aplicației (albă),
  // ca să nu apară o trecere de culoare între ele
  themeColor: "#ffffff",
  // Pagina ocupă tot ecranul, inclusiv sub colțurile rotunjite și bara de gesturi; barele de sus și de jos
  // se feresc singure de ele cu env(safe-area-inset-*) (vezi topbar.tsx și bottombar.tsx)
  viewportFit: "cover",
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
    // suppressHydrationWarning: extensiile de browser (ex. LanguageTool, Grammarly) adaugă atribute
    // pe <html> înainte să pornească React -> eroare de hydration falsă. Se aplică doar acestui element.
    <html lang="ro" suppressHydrationWarning>
      <body className={`${poppins.variable} ${geistMono.variable} antialiased`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
        <OfflineOverlay />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
