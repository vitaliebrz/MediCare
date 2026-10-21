# Aplicație instalabilă (PWA)

**Stare:** implementat · **Data planului:** 2026-10-21

## Context
MediCare trebuie să se poată instala pe telefon și pe calculator ca o aplicație: iconiță pe ecranul principal, fereastră proprie fără bara browserului, ecran propriu când nu e internet. Totul fără App Store sau Google Play: orice actualizare publicată pe Vercel ajunge imediat la toți.

Ghidul urmat: `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` (Next.js 16).

## Ce s-a făcut
| Piesă | Fișier | Rol |
|---|---|---|
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` | nume, culoare (`#14b8a6`), pornire pe `/`, `display: standalone`, iconițe |
| Iconițe | `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Android / desktop; varianta `maskable` lasă Android să decupeze forma fără să taie dintele |
| iPhone | `src/app/apple-icon.png`, `appleWebApp` în `layout.tsx` | iconița de pe ecranul principal, deschidere fără bara Safari |
| Favicon | `src/app/icon.svg` | dintele MediCare în tab (a înlocuit iconița implicită `favicon.ico` a Next.js) |
| Culoare | `viewport.themeColor` în `layout.tsx` | bara de sus a telefonului / ferestrei instalate |
| Service worker | `public/sw.js`, înregistrat de `src/components/service-worker-register.tsx` | fără internet, la deschiderea unei pagini arată `public/offline.html` |
| Antete | `headers()` în `next.config.ts` | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`; pentru `sw.js`: fără cache, CSP strict |
| Proxy | `matcher` în `src/proxy.ts` | manifestul, `sw.js` și `offline.html` se încarcă fără login |

Iconițele sunt generate din dintele din meniu (hugeicons `dental-tooth`), alb pe turcoaz, cu `sharp`.

## Decizii
- **Nu păstrăm date medicale pe dispozitiv.** Service worker-ul intervine doar la navigări (rețeaua întâi, apoi pagina offline). În cache stau doar `offline.html` și iconița ei. Un telefon pierdut nu conține fișe de pacienți.
- **Fără buton propriu „Instalează”.** Ghidul Next.js nu-l recomandă: `beforeinstallprompt` nu există pe iPhone. Browserul oferă singur instalarea.
- **Service worker-ul doar în producție.** În `next dev` ar putea servi fișiere vechi.
- **Proxy-ul exclude fișierele PWA.** Browserul le cere fără cookie de sesiune; o redirecționare la `/login` ar face manifestul invalid și instalarea imposibilă.

## Cum se instalează
- **Android / Chrome pe calculator:** iconița de instalare din bara de adrese sau meniul ⋮ → „Instalați aplicația”.
- **iPhone (Safari):** Share → „Adaugă pe ecranul principal”.

Instalarea cere HTTPS, deci pe telefon merge pe adresa Vercel. Local merge doar pe `localhost`, cu `npm run preview`.

## Verificat
- `tsc`, `eslint`, `next build`: build-ul generează `/manifest.webmanifest`, `/icon.svg` și `/apple-icon.png`.
- Pe serverul de producție, **fără login**, toate răspund 200: manifestul, `sw.js` (cu antetele de mai sus), `offline.html` și iconițele. `/` trimite în continuare la `/login`.
- `<head>` conține `rel="manifest"`, `theme-color`, `apple-touch-icon` și `apple-mobile-web-app-*`.

## Nu intră acum
- Notificări push pe telefon (chei VAPID, abonamente salvate, trimitere programată).
- Lucru offline cu date (pacienți, programări) și sincronizare.
