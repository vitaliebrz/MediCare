# Performanță

**Stare:** implementat · **Data planului:** 2026-10-21

Aplicația răspundea greu la fiecare click. Am măsurat cauzele pe calculatorul de dezvoltare (Chișinău → Supabase `eu-west-1`, Irlanda), apoi le-am eliminat în ordinea câștigului.

## Ce costa timp (măsurat)

| Operație | Durată | Cât de des |
|---|---|---|
| `auth.getUser()`: cerere la serverul Supabase Auth | **180–685 ms** (variabil) | **de 2 ori la fiecare click**: middleware + `getCurrentUser` |
| `auth.getClaims()`: verificare locală a tokenului (ES256) | **2–4 ms** (~140 ms doar la primul apel, care descarcă cheia publică) | — |
| O interogare SQL prin pooler | ~80 ms | 3–6 pe pagină, unele una după alta |
| O conexiune nouă la baza de date | ~630 ms | în `next dev`, la fiecare reîncărcare a codului |

## Ce s-a schimbat

1. **Autentificare locală.** În `src/proxy.ts` și în `getCurrentUser`, `getUser()` a devenit `getClaims()`.
   - Semnătura tokenului e verificată local, cu cheia publică a proiectului. Cheia e ținută în memoria serverului, comună tuturor cererilor (`GLOBAL_JWKS` din `@supabase/auth-js`).
   - Un token falsificat e respins, la fel ca înainte.
   - Singura diferență: un cont blocat din panoul Supabase rămâne valid până expiră tokenul (implicit 1 oră).
2. **`middleware.ts` → `proxy.ts`**, redenumire cerută de Next 16. Logica a rămas aceeași.
3. **Ecrane de încărcare (`loading.tsx`)** pentru dashboard, pacienți, fișa pacientului, fișe medicale, programări și rapoarte. Piesele comune sunt în `src/components/loading/skeletons.tsx`. După click apare imediat un schelet cu forma paginii; meniul rămâne pe loc.
4. **Conexiunea la baza de date păstrată pe `globalThis` în dev** (`src/lib/db/index.ts`). Fără ea, fiecare reîncărcare a codului deschidea conexiuni noi.
5. **Interogări în paralel, nu una după alta:**
   - `getPatients`: numărarea, rândurile și totalurile împreună;
   - `getPatientChart`: pacientul, dinții și tratamentele împreună;
   - `getReport`: medicii și raportul împreună;
   - pagina Programări: programările împreună cu medicii, serviciile și setările.

   Toate filtrează pe `clinic_id`, deci un id străin din URL dă un rezultat gol, nu date ale altei clinici.
6. **Data creării clinicii ținută în memorie** (`getClinicCreatedOn` în `sql-helpers.ts`). Nu se schimbă niciodată, iar dashboard-ul și rapoartele o așteptau înaintea celorlalte interogări.
7. **Scriptul `npm run preview`** (`next build && next start`). Viteza reală se vede doar în producție: `next dev` compilează fiecare pagină la prima vizită și nu face prefetch.

## Rezultat (producție, timpul complet al răspunsului, mediana din 5)

| Pagina | După |
|---|---|
| Dashboard | 441 ms |
| Pacienți | 473 ms |
| Programări | 402 ms |
| Rapoarte | 383 ms |
| Fișe medicale | 372 ms (înainte de pasul 5: ~750 ms) |

**Înainte:** la timpii de mai sus se adăugau două verificări `getUser()` (2 × 180–685 ms), plus pașii secvențiali eliminați (~80 ms fiecare). Asta înseamnă aproximativ **0,8–2 s pe click**, față de **~0,4 s** acum.

Comparația „înainte” e estimată din măsurătorile pe componente. Construirea versiunii vechi într-un `git worktree` a eșuat: Turbopack nu acceptă `node_modules` legat din alt folder.

Pe lângă timpul total, ecranul de încărcare apare imediat după click, deci aplicația nu mai pare blocată în timpul celor ~0,4 s.

## Verificat
- Autentificarea, testată cu un utilizator temporar:
  - fără sesiune → `/login`;
  - token cu semnătura falsificată → `/login`;
  - logat pe `/login` → `/`.
- Cifrele rapoartelor sunt identice cu cele de dinainte (scripturile de verificare a rapoartelor).
- `next build` fără erori; `tsc` și `eslint` curate.

## Ce mai rămâne (dacă va fi nevoie)
- **Profilul utilizatorului în token** (Supabase Auth Hook cu `clinic_id`): elimină interogarea `users` de la fiecare cerere (~80 ms).
- **Proiect Supabase în Frankfurt** (`eu-central-1`): ~40 ms în loc de ~80 ms pe interogare.
- **Cache pe date** (`use cache`): doar pentru date care se schimbă rar (medici, servicii, categorii), cu invalidare la salvare.

## Incident în timpul lucrului
La ștergerea copiei temporare folosite pentru comparație, comanda a urmat legătura (junction) spre `node_modules`-ul proiectului și a șters o parte din pachete. `npm install` le-a refăcut din `package-lock.json` (fără schimbări de versiuni). Verificat: 0 pachete necesare lipsă, `tsc`, `eslint` și `next build` trec.

**Regulă de reținut:** pe Windows, un folder care conține o legătură (junction) se șterge întâi desfăcând legătura nerecursiv (`[System.IO.Directory]::Delete(path, $false)`), apoi restul.
