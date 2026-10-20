# Rapoarte (`/rapoarte`)

**Stare:** implementat · **Data planului:** 2026-10-20

Dashboard-ul dă privirea de ansamblu. Rapoartele răspund la întrebări concrete, cu filtre și export CSV/PDF: câți bani am facturat și încasat, cine datorează și de cât timp, cât aduce fiecare medic, ce servicii merg, cât de plin e programul, pe cine trebuie să rechem.

## Structura paginii

```
Rapoarte                                   [Ultimele 30 de zile ▾] [Toți medicii ▾] [PDF]
[ Financiar | Medici | Servicii | Programări și pacienți ]
Financiar și datorii · Ultimele 30 de zile · Dr. …
┌ cifre-cheie (5) ─────────────────────────────────────────────┐
┌ grafic ──────────────────────────────────────────────────────┐
┌ tabel [CSV] ─────────────────────────────────── (linie Total) ┐
```

- Totul stă în URL: `?raport=medici&perioada=2026-09&medic=<id>`. Valorile implicite (Financiar, 30 de zile, toți medicii) nu apar în URL, iar cele invalide devin implicite.
- **Perioadele** sunt cele ale dashboard-ului (7z, 30z, luni, „De la început”). `PeriodSelect` primește `basePath` și `query`, ca să păstreze ceilalți parametri.
- **Filtrul de medic** se aplică la Financiar, Servicii și Programări. Raportul Medici îi arată oricum pe toți. Un medic din altă clinică în URL e ignorat.
- **CSV** e pe fiecare tabel (butonul din colțul lui). **PDF** e pentru raportul întreg (bara de sus, tab nou).

## Definiții (aceleași peste tot)

| Termen | Calcul |
|---|---|
| **Facturat** | suma `treatments.price` cu `performed_at` în perioadă |
| **Încasat** | suma `treatments.price` cu `paid_at` în perioadă (ziua în ora Chișinăului). **Identic cu „Venit” din dashboard.** |
| **Rata de încasare** | din facturatul perioadei, partea achitată până azi |
| **Datorie** | tratamente neachitate cu preț > 0. E o valoare la zi, nu depinde de perioadă. Identică cu „Datorii” din dashboard și cu „Datorie” din Fișe medicale. |
| **Vechimea datoriei** | zile de la `performed_at` până azi: 0–30 / 31–60 / 61–90 / peste 90 |
| Medicul unui venit | medicul tratamentului. Al unei programări: medicul programării. Fără medic → „Fără medic”. |
| **Ultima vizită** (rechemare) | cea mai recentă dintre: ultimul tratament și ultima programare finalizată |

## Rapoartele

| Raport | Cifre-cheie | Grafic | Tabele (fiecare cu CSV) |
|---|---|---|---|
| **Financiar** | Facturat · Încasat · Rata de încasare · Datorii totale · Debitori | Facturat vs. Încasat (coloane grupate) | Pe categorii de servicii · Vechimea datoriilor (afișată ca 4 cutii, cu 90+ zile evidențiat) · Debitori (după sumă, cu telefon) |
| **Medici** | Medici activi · Tratamente · Facturat · Încasat · Programări | Facturat pe medic (bare în culoarea medicului) | Activitatea medicilor: tratamente, pacienți unici, facturat, încasat, medie, programări, finalizate, % anulate, % neprezentări |
| **Servicii** | Tratamente · Facturat · Preț mediu · Servicii diferite · Fără cerere | Top 10 servicii după facturat | Servicii pe categorii (subtotal pe categorie) · Servicii fără cerere în perioadă |
| **Programări și pacienți** | Programări · Finalizate · % anulate · % neprezentări · Pacienți noi | Pacienți noi pe zile/luni | Pe medic și status · Ocupare pe zile × ore (afișată ca hartă de căldură) · Pacienți pe categorii · De rechemat (peste 6 luni fără vizită și fără programare viitoare) |

## Arhitectura

| Fișier | Rol |
|---|---|
| `src/lib/reports/types.ts` | descrierea comună a unui tabel (`ReportTable`: coloane cu format, rânduri, Total). Din ea se construiesc pagina, CSV-ul și PDF-ul. |
| `src/lib/reports/params.ts` | rapoartele, filtrele permise, `reportQuery` (URL-uri) |
| `src/lib/reports/format.ts`, `csv.ts` | afișarea valorilor; CSV pentru Excel în română |
| `src/lib/db/report-queries.ts` | interogările (fără `'use server'`), câte o funcție pe raport |
| `src/lib/db/sql-helpers.ts` | `TZ`, `localDate`, `localDateUtc`, `num`, mutați din `dashboard-queries.ts` |
| `src/lib/actions/reports.ts` | `getReport`: `clinicId` din sesiune, verifică medicul |
| `src/app/(dashboard)/rapoarte/page.tsx` | pagina |
| `src/app/(dashboard)/rapoarte/csv/route.ts`, `pdf/route.ts` | exporturile (`Cache-Control: private, no-store`) |
| `src/components/reports/*` | filtre, tab-uri, cifre-cheie, tabel generic, grafice, PDF |

## Decizii
- **O singură descriere pe tabel** pentru pagină, CSV și PDF, ca cele trei să nu poată arăta cifre diferite.
- **CSV pentru Excel în română:**
  - BOM UTF-8, pentru diacritice;
  - separator `;` și zecimale cu virgulă, ca sumele să fie recunoscute ca numere;
  - moneda trecută în antetul coloanei;
  - telefonul și IDNP-ul scrise ca `="069…"`, altfel Excel ar șterge zeroul din față sau le-ar afișa ca `2,00E+12`.
- **PDF:**
  - pe orizontală când un tabel are peste 7 coloane;
  - antetul tabelului se repetă pe fiecare pagină;
  - fără grafice, pentru că la printat tabelele sunt mai utile.
- **Culori (verificate cu validatorul dataviz):**
  - Facturat `#2a78d6` / Încasat `#0d9488` (Încasat e teal ca în dashboard). Perechea trece toate verificările, inclusiv daltonismul (ΔE 15,7).
  - Harta de ocupare are o singură nuanță (teal), de la deschis la închis, cu numărul scris în fiecare celulă.
  - Barele pe medic au culoarea medicului din setări, iar numele și suma sunt scrise lângă bară.
- **Interogări:** SQL-ul scris direct folosește aliasuri explicite (`t.patient_id = p.id`), din cauza bug-ului găsit în Fișe medicale: Drizzle scrie `${tabel.coloana}` ca `"coloana"`, fără numele tabelului.

## Abateri de la plan
- **CSV pe fiecare tabel** (buton în colțul lui), nu un meniu comun în bara de sus: se vede direct ce se descarcă.
- **Barele orizontale** (medici, servicii) sunt în HTML/CSS, nu în Recharts: numele lungi încap mai bine, iar suma e scrisă lângă bară.
- **„De rechemat” și categoriile de pacienți** nu folosesc filtrul de medic. Se spune în descrierea tabelului.

## Verificare făcută
Verificarea s-a făcut prin funcțiile din aplicație, nu prin SQL scris de mână, pe toate clinicile, pe „30 de zile” și pe „De la început”:
- Încasat = Venit din dashboard;
- Datorii = Datorii din dashboard = suma debitorilor = suma pe vechimi;
- Facturat = suma pe categorii = suma graficului = suma pe medici = Facturat din Servicii;
- Servicii filtrat pe un medic = rândul medicului din raportul Medici;
- Programări = suma pe status = Programări din raportul Medici;
- harta de ocupare = programările fără cele anulate;
- pacienți noi: graficul = cifra-cheie = tabelul.

Teste suplimentare:
- **„De rechemat”**, pe o clinică temporară (ștearsă apoi): apare doar pacientul cu vizită acum 8 luni. Nu apar cel cu programare viitoare și nici cel cu vizită acum 2 luni.
- **CSV și PDF** generate pentru toate cele 4 rapoarte și verificate vizual.
- **Rutele** `/rapoarte`, `/rapoarte/csv` și `/rapoarte/pdf` trimit la login fără sesiune.

## Nu intră în acest modul
- Plăți parțiale și metoda de plată (cer tabelul `payments`)
- Comparația cu perioada anterioară (o are dashboard-ul)
- Interval de date ales liber (de la–până la)
- Rapoarte trimise automat pe email
- Mod întunecat validat separat pentru grafice
