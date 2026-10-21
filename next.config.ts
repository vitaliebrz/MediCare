import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.8.116',
    'localhost',
  ],
  experimental: {
    serverActions: {
      // Logo-ul clinicii (max. 1 MB) se trimite printr-o Server Action; implicit limita e 1 MB
      // pentru tot corpul cererii, iar formularul adaugă câțiva KB în plus.
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        // Pentru toate paginile (recomandarea din ghidul PWA al Next.js)
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' }, // browserul nu „ghicește” tipul fișierelor
          { key: 'X-Frame-Options', value: 'DENY' }, // aplicația nu poate fi pusă într-un iframe pe alt site
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Service worker-ul: mereu versiunea nouă, scripturi doar de pe site
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  images: {
    // Logo-ul clinicii, afișat cu <Image> din Supabase Storage
    remotePatterns: [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`)],
  },
};

export default nextConfig;