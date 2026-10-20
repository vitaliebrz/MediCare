// Logo-ul clinicii: PNG sau JPG (generatorul de PDF nu suportă SVG/WebP), max. 1 MB.
// Se păstrează în Supabase Storage (bucket public), iar în clinic_settings.logo_url rămâne adresa lui.

export const LOGO_BUCKET = 'clinic-logos';
export const MAX_LOGO_BYTES = 1024 * 1024;
export const LOGO_TYPES = { png: 'image/png', jpg: 'image/jpeg' } as const;
export type LogoFormat = keyof typeof LOGO_TYPES;

// Tipul real al fișierului, după primii octeți (extensia sau tipul trimis de browser pot minți)
export function detectLogoFormat(bytes: Uint8Array): LogoFormat | null {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
    return null;
}

// Logo-ul pentru PDF, descărcat pe server. Dacă lipsește sau nu se poate citi, PDF-ul se face fără logo
// (nu vrem ca o imagine lipsă să blocheze fișa sau raportul).
export async function loadLogoForPdf(logoUrl: string | null | undefined): Promise<{ data: Buffer; format: LogoFormat } | null> {
    // Doar din Storage-ul proiectului nostru, nu de la orice adresă salvată în baza de date
    const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/`;
    if (!logoUrl?.startsWith(storagePrefix)) return null;
    try {
        const response = await fetch(logoUrl, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
        if (!response.ok) return null;
        const data = Buffer.from(await response.arrayBuffer());
        const format = detectLogoFormat(data);
        return format && data.length <= MAX_LOGO_BYTES ? { data, format } : null;
    } catch {
        return null;
    }
}
