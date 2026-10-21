import type { MetadataRoute } from 'next';

// Manifestul aplicației instalabile (PWA). Next.js îl servește la /manifest.webmanifest
// și adaugă singur <link rel="manifest"> în <head>. Iconițele sunt în public/icons/.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MediCare – Cabinet stomatologic',
        short_name: 'MediCare',
        description: 'Pacienți, programări, fișe medicale și rapoarte pentru cabinetul stomatologic.',
        lang: 'ro',
        start_url: '/',
        scope: '/',
        display: 'standalone', // fereastră proprie, fără bara de adrese a browserului
        background_color: '#ffffff',
        theme_color: '#14b8a6', // turcoazul aplicației (teal-500)
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            // Android decupează iconița în forma lui (cerc, pătrat rotunjit); dintele stă în zona sigură
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
