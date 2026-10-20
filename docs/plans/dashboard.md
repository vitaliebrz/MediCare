# Dashboard (`/`)

**Stare:** implementat · **Data planului:** 2026-10-15

Pagina principală a aplicației: cifre-cheie cu comparație față de perioada anterioară, încasări, programările zilei, top tratamente și activitate recentă. Rapoartele detaliate (filtre, export) sunt un modul separat, planificat ulterior.

## Structura paginii

```
Dashboard                                              [Ultimele 30 de zile ▾]
┌ [Users]   ↗ +12% ┐ ┌ [Calendar] ↘ −5% ┐ ┌ [Wallet]  ↗ +18% ┐ ┌ [Coins]   ↘ −9% ┐
│ Pacienți totali   │ │ Programări        │ │ Venit             │ │ Datorii totale   │
│ 124               │ │ 38                │ │ 12 400 MDL        │ │ 3 150 MDL        │
│ vs. 30 zile ant.  │ │ vs. 30 zile ant.  │ │ vs. 30 zile ant.  │ │ vs. 30 zile ant. │
└───────────────────┘ └───────────────────┘ └───────────────────┘ └──────────────────┘
┌ Încasări în perioadă (coloane) ──────────────┐ ┌ Programări azi ─────────────┐
└──────────────────────────────────────────────┘ └─────────────────────────────┘
┌ Top 5 tratamente (diagramă circulară) ┐ ┌ Activitate recentă ─────────────┐
└───────────────────────────────────────┘ └──────────────────────────────────┘
```

Pe desktop, rândul 2 e împărțit 2/3 + 1/3, iar rândul 3 jumătate-jumătate. Pe telefon cardurile sunt 2×2, iar restul blocurilor unul sub altul.

## Perioada

Un singur selector, în antetul paginii, salvat în URL ca `?perioada=`. Se aplică la cele 4 carduri, la graficul de încasări și la Top 5. **Programări azi** și **Activitate recentă** nu depind de perioadă.

| `?perioada=` | Perioada | Comparată cu |
|---|---|---|
| `7z` | ultimele 7 zile (cu azi) | cele 7 zile dinainte |
| `30z` (implicit) | ultimele 30 de zile | cele 30 de zile dinainte |
| `2026-09` | o lună încheiată | luna dinainte, întreagă |
| `2026-10` (luna curentă) | 1 → azi | **aceleași zile** din luna trecută |
| `tot` | de la crearea clinicii | — (fără procent) |

Selectorul oferă lunile de la luna creării clinicii (`clinics.created_at`) până la luna curentă. O valoare invalidă în URL devine `30z`.

**De ce „aceleași zile” la luna curentă:** pe 15 octombrie, luna e pe jumătate. Comparată cu tot septembrie, ar părea mereu în scădere. Comparăm 1–15 octombrie cu 1–15 septembrie (metoda „month-to-date”).

**Fus orar:** „azi”, începutul lunii și gruparea pe zile se calculează în `Europe/Chisinau`, nu în fusul serverului. Pe Netlify serverul rulează în UTC, iar o programare la 00:30 ora Chișinăului ar cădea în ziua anterioară.

## Cifre-cheie

| Card | Iconiță | Valoare | Sursa | Creștere = |
|---|---|---|---|---|
| Pacienți totali | `Users` | pacienți înregistrați până la sfârșitul perioadei | `patients.created_at` | bine |
| Programări | `CalendarCheck` | programări în perioadă, fără `anulat` | `appointments.starts_at`, `status` | bine |
| Venit | `Wallet` | sumă încasată în perioadă | `treatments.price` cu `paid_at` în perioadă | bine |
| Datorii totale | `HandCoins` | neachitat la sfârșitul perioadei | `treatments` efectuate ≤ T și `paid_at` null sau > T | **rău** |

**Pacienți totali** și **Datorii totale** sunt valori cumulate: comparăm totalul de la sfârșitul perioadei curente cu totalul de la sfârșitul perioadei anterioare.

### Procentul de schimbare
- `(curent − anterior) / anterior × 100`, rotunjit la un număr întreg
- `anterior = 0` și `curent > 0` → „Nou”; ambele 0 → nu afișăm nimic
- `?perioada=tot` → nu afișăm procent
- **Culoarea urmează sensul, nu semnul.** Fiecare card are `higherIsBetter`. La Datorii e `false`, deci o scădere e verde. 0% e gri.
- Lângă culoare apar mereu iconița (`TrendingUp` / `TrendingDown` / `Minus`) și semnul (+/−), ca să nu fie un semnal doar prin culoare.
- Logica e în `src/lib/percent-change.ts`, testată separat.

## Blocuri

**Încasări în perioadă.** Coloane, o singură serie: suma `price` grupată după ziua din `paid_at`. Pentru `tot`, grupată pe lună. Zilele fără încasări apar cu 0. Definiția e identică cu cea a cardului „Venit”, deci totalurile coincid.

**Programări azi.** Programările de azi, ordonate după oră: ora, pacient (link spre fișă), medic (cu `doctors.color`), motiv, status. Starea goală are link spre `/programari`.

**Top 5 tratamente.** Diagramă circulară cu gol în mijloc (totalul tratamentelor din perioadă). Conține cele mai frecvente 5 servicii plus o felie gri „Altele”, ca procentele să însumeze 100%. Legenda de dedesubt arată culoarea, numele, numărul și procentul. Tratamentele fără serviciu sunt grupate după `treatment_description`.

**Activitate recentă.** Ultimele 6 evenimente, tratamente adăugate și pacienți noi, ordonate după dată, cu link spre fișă.

## Decizii de date

### `treatments.paid_at` (coloană nouă)
Înainte aveam doar `paid` (boolean), deci nu știam **când** s-a încasat un tratament. Fără dată, Venitul pe perioadă și Datoriile de la o dată anterioară nu se pot calcula corect.
- Se setează automat în `src/lib/actions/treatments.ts`:
  - tratament creat ca achitat → `now()` dacă tratamentul e de azi; dacă e înregistrat retroactiv, ziua tratamentului (la prânz, ora Chișinăului), ca încasarea să apară în ziua în care s-a făcut
  - bifat „achitat” din istoric → `now()` (dacă nu avea deja o dată)
  - debifat → `null`
- La migrare, rândurile cu `paid = true` au primit `paid_at = performed_at`.
- `paid` rămâne sursa pentru UI (bifa), iar `paid_at` e folosit doar pentru rapoarte.
- Limită cunoscută: nu există plăți parțiale. Un tabel `payments` e planificat pentru Rapoarte.

### Tabelul `appointments` (nou)
Creat acum pentru că dashboard-ul îl citește. Pagina Programări (calendar, adăugare) este modulul următor.
- `id`, `clinic_id`, `patient_id` (→ patients, cascade), `doctor_id` (→ doctors, set null)
- `starts_at` (timestamptz), `duration_minutes` (implicit 30), `reason`, `notes`
- `status`: `programat | confirmat | finalizat | anulat | neprezentat`
- `created_by` (→ users), `created_at`
- index `(clinic_id, starts_at)`

## Fișiere

| Fișier | Rol |
|---|---|
| `src/lib/actions/dashboard.ts` | server action `getDashboardData(period)`: ia `clinicId` din sesiune și apelează interogările |
| `src/lib/db/dashboard-queries.ts` | toate interogările SQL, în paralel, cu `clinicId` ca parametru (fără `'use server'`, vezi mai jos) |
| `src/lib/dashboard-period.ts` | parsează `?perioada=`, calculează intervalele (curent și anterior) și lunile disponibile |
| `src/lib/percent-change.ts` | procentul și direcția (bine/rău) |
| `src/app/(dashboard)/page.tsx` | pagina (Server Component) |
| `src/components/dashboard/stat-card.tsx` | cardul de cifră-cheie |
| `src/components/dashboard/period-select.tsx` | selectorul de perioadă (client) |
| `src/components/dashboard/revenue-chart.tsx` | graficul de încasări (Recharts) |
| `src/components/dashboard/top-treatments-chart.tsx` | diagrama circulară și legenda |
| `src/components/dashboard/today-appointments.tsx` | lista programărilor de azi |
| `src/components/dashboard/recent-activity.tsx` | activitatea recentă |

## Reguli
- **Agregările se fac în SQL** (`sum`, `count`, `group by`, `date_trunc`, `filter (where …)`), nu în JavaScript.
- **Fiecare interogare filtrează după `clinic_id`** al utilizatorului logat (`getCurrentUser()`), ca în tot proiectul.
- **Grafice:** un singur ax Y, grilă discretă, culori teal pentru încasări, o paletă categorială de 5 culori validată (contrast și daltonism) pentru Top 5, „Altele” mereu gri, iar textul în culorile textului, nu ale seriei.
- **Stări goale** explicite („Nicio încasare în această perioadă”), nu grafice goale.

## Abateri de la plan (notate la implementare)
- **Interogările sunt în `src/lib/db/dashboard-queries.ts`, nu în fișierul de acțiuni.** Într-un fișier `'use server'`, orice funcție exportată devine un endpoint apelabil din browser. O funcție care primește `clinicId` ca parametru ar permite citirea datelor oricărei clinici. Acțiunea `getDashboardData` e un strat subțire care ia `clinicId` doar din sesiune. Separarea permite și testarea interogărilor cu o zi fixă (`today`).
- **Programări azi** afișează și programările anulate (tăiate, cu status „Anulat”), ca recepția să vadă tot ce era planificat. Cardul „Programări” le exclude.
- **Valori `Date` în `sql```** scris manual se trimit ca text ISO cu `::timestamptz`. Driverul `postgres` nu acceptă obiecte `Date` ca parametri în acest caz (bug găsit la testare, în `updateTreatment`).
- Paleta pentru Top 5, în ordine: `#0d9488` (teal), `#eb6834`, `#2a78d6`, `#eda100`, `#4a3aa7`, plus `#a1a1aa` pentru „Altele”. Validată pe fundal alb: trece toate verificările. Galbenul are contrast < 3:1, compensat prin legenda cu nume, număr și procent.

## Verificare făcută
- Test pe două clinici temporare (șterse apoi): cifre-cheie, procente, serie continuă cu zile 0, „Altele”, programare la 00:30 ora Chișinăului ca „azi”, luna curentă comparată cu aceleași zile, „De la început” pe luni, izolarea între clinici.
- `paid_at`: bifat → setat; bifat din nou → neschimbat; debifat → `null`.
- Randare pe server a tuturor componentelor cu date de test.

## Nu intră în acest modul
- pagina Programări (calendar, adăugare/editare programări)
- pagina Rapoarte (filtre detaliate, export CSV/PDF)
- tabelul `payments` (plăți parțiale, metodă de plată)
