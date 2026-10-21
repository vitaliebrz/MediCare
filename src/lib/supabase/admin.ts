// Acces la Supabase Storage cu cheia de serviciu (ocolește regulile de acces). Doar pe server:
// cheia nu are prefixul NEXT_PUBLIC_, deci nu ajunge niciodată în browser.
// Se folosește numai DUPĂ ce acțiunea a verificat utilizatorul (getCurrentUser).
//
// Folosim direct API-ul HTTP al Storage, nu clientul @supabase/supabase-js: acela pornește și
// partea de realtime (WebSocket), care pe Node.js 20 nu există și oprește crearea clientului.

const baseUrl = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`;
const headers = (extra: Record<string, string> = {}) => ({
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
});

async function request(path: string, init: RequestInit & { headers?: Record<string, string> }) {
    const response = await fetch(`${baseUrl()}${path}`, { ...init, headers: headers(init.headers), cache: 'no-store' });
    if (!response.ok) throw new Error(`Storage ${response.status}: ${await response.text()}`);
    return response;
}

export const storage = {
    async bucketExists(bucket: string) {
        const response = await fetch(`${baseUrl()}/bucket/${bucket}`, { headers: headers(), cache: 'no-store' });
        return response.ok;
    },

    async createBucket(bucket: string, options: { public: boolean; fileSizeLimit: number; allowedMimeTypes: string[] }) {
        await request('/bucket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: bucket, name: bucket, public: options.public,
                file_size_limit: options.fileSizeLimit, allowed_mime_types: options.allowedMimeTypes,
            }),
        });
    },

    async upload(bucket: string, path: string, body: Uint8Array, contentType: string) {
        await request(`/object/${bucket}/${path}`, { method: 'POST', headers: { 'Content-Type': contentType }, body: Buffer.from(body) });
    },

    async list(bucket: string, prefix: string): Promise<string[]> {
        const response = await request(`/object/list/${bucket}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix, limit: 100 }),
        });
        const files = (await response.json()) as { name: string }[];
        return files.map((file) => `${prefix}/${file.name}`);
    },

    async remove(bucket: string, paths: string[]) {
        if (paths.length === 0) return;
        await request(`/object/${bucket}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefixes: paths }),
        });
    },

    publicUrl: (bucket: string, path: string) => `${baseUrl()}/object/public/${bucket}/${path}`,
};
