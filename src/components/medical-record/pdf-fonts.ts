import path from 'node:path';
import { Font } from '@react-pdf/renderer';

// Fonturile standard din PDF (Helvetica) nu au ș, ț, ă, î, â. Folosim Noto Sans (licență OFL, vezi OFL.txt).
// Fișierele se citesc de pe disc, deci acest modul rulează doar pe server (în Route Handler).
const fontsDir = path.join(process.cwd(), 'src/assets/fonts');

export const PDF_FONT = 'NotoSans';

Font.register({
    family: PDF_FONT,
    fonts: [
        { src: path.join(fontsDir, 'NotoSans-Regular.ttf'), fontWeight: 'normal' },
        { src: path.join(fontsDir, 'NotoSans-Bold.ttf'), fontWeight: 'bold' },
    ],
});

// Fără despărțire în silabe (implicit react-pdf desparte cuvintele după reguli englezești)
Font.registerHyphenationCallback((word) => [word]);
