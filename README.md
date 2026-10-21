# MediCare: gestiunea unui cabinet stomatologic

Aplicație web pentru un cabinet stomatologic: pacienți, programări, schema dentară, tratamente, fișe medicale (Formular 043/e) și rapoarte.

> Proiect personal de învățare. Datele demonstrative sunt inventate; aplicația nu conține date reale ale pacienților.

## Demo
**https://medicare-ochre-zeta.vercel.app/login**

| Email | Parolă |
|---|---|
| `user@mail.com` | `user1234!` |

Contul demo are o clinică cu pacienți, programări, tratamente și rapoarte (toate inventate). Aplicația se poate și instala pe telefon (PWA).

## Ce face
- **Dashboard**: pacienți, programări, venit și datorii pe perioadă, programările de azi, activitatea recentă.
- **Pacienți**: listă cu căutare, fișa pacientului cu schema dentară (adult / copil, notația FDI), istoric de tratamente și plăți.
- **Programări**: calendar pe zi și pe săptămână, pe medici. Durata vine din serviciu. Un pacient nou se poate crea direct din programare.
- **Fișe medicale**: Formularul 043/e în PDF, gata de printat.
- **Rapoarte**: financiar și datorii, medici, servicii, programări și pacienți, cu export CSV (Excel) și PDF.
- **Notificări**: alerte calculate din date (programări neconfirmate, datorii vechi, pacienți de rechemat...).
- **Setări**: clinica (logo, program de lucru), categorii, servicii, medici, notificări, cont.
- **Aplicație instalabilă (PWA)**: se poate instala pe telefon sau calculator (iconiță, fereastră proprie, ecran „fără internet”).

## Tehnologii
- [Next.js 16](https://nextjs.org) (App Router, Server Actions), React 19, TypeScript
- [Supabase](https://supabase.com): autentificare, Postgres, Storage
- [Drizzle ORM](https://orm.drizzle.team) pentru baza de date
- Tailwind CSS + shadcn/ui (Base UI), Recharts, `@react-pdf/renderer`
- Găzduire: [Vercel](https://vercel.com) (regiunea `dub1`, lângă baza de date Supabase din `eu-west-1`)

Deciziile fiecărui modul sunt în [docs/plans](docs/plans/README.md).

## Pornire locală
1. `npm install`
2. Copiază `.env.example` în `.env.local` și completează valorile din proiectul Supabase.
3. `npm run db:push` creează tabelele în baza de date.
4. `npm run dev`, apoi deschide http://localhost:3000 și creează un cont (Înregistrare).

Pentru viteza reală (producție): `npm run preview`.

## Publicare pe Vercel
1. Pe [vercel.com](https://vercel.com): **Add New → Project**, importă acest repository. Framework-ul (Next.js) se detectează singur.
2. În **Environment Variables** adaugă `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` și `DATABASE_URL` (vezi `.env.example`).
3. **Deploy.** Fiecare push pe `main` publică automat o versiune nouă.
4. În Supabase → **Authentication → URL Configuration**:
   - pune adresa site-ului la **Site URL**;
   - adaugă `https://<adresa-ta>.vercel.app/**` la **Redirect URLs**. Fără ea, linkul din emailul de resetare a parolei nu merge.
