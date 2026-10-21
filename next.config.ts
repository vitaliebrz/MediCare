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
  images: {
    // Logo-ul clinicii, afișat cu <Image> din Supabase Storage
    remotePatterns: [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`)],
  },
};

export default nextConfig;