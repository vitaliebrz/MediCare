# Fișe medicale (`/fise-medicale`)

**Stare:** implementat · **Data planului:** 2026-10-19

Generează **Fișa medicală a bolnavului stomatologic (Formular 043/e)** în PDF, ca să poată fi printată, semnată și păstrată la dosar. PDF-ul se completează automat cu datele din aplicație. Secțiunile pentru care aplicația nu are încă date se tipăresc cu rânduri goale, de completat de mână.

> Structura urmează forma **standard** a formularului 043/e. Trebuie comparată cu formularul folosit efectiv în clinică și ajustată dacă e nevoie.

## Pagina

```
Fișe medicale
[Activi | Arhivați | Toți]                     [🔍 Caută după nume, telefon sau IDNP]
┌ Nr. fișă ┬ Pacient ────┬ IDNP ────────────┬ Ultimul tratament ┬ Tratamente ┬ Fișa 043/e ──────────┐
│ 12       │ Popescu Ion │ 2000000000000    │ 15.10.2026        │ 4          │ [👁 Deschide] [⬇ PDF] │
│ 13       │ Rusu Ana    │ ⚠ Date incomplete│ —                 │ 0          │ [👁 Deschide] [⬇ PDF] │
└──────────┴─────────────┴──────────────────┴───────────────────┴────────────┴──────────────────────┘
```

- **Deschide**: PDF-ul în tab nou, în vizualizatorul browserului (de acolo se printează). **PDF**: descărcare.
- **Cost servicii / Achitat / Datorie** pe fiecare pacient: suma prețurilor tuturor tratamentelor, partea achitată (tratamentele marcate „Achitat”) și diferența. Datoria apare portocalie doar când e mai mare ca 0.
- **Linia Total** de la final adună costul, suma achitată și datoria pentru **toți pacienții din filtru**, nu doar pentru cei 20 de pe pagina curentă. Altfel totalul s-ar schimba de la o pagină la alta. Se calculează printr-o interogare separată, cu aceeași căutare și același status (`getPatients({ withTotals: true })`).
- Filtrele, căutarea și paginarea sunt cele din lista de pacienți, refolosite prin proprietatea `basePath`.
- Pacienții fără IDNP au avertizarea „Date incomplete”. Fișa se poate genera, dar IDNP-ul ar trebui completat înainte de printare.
- Butonul **„Fișa 043/e”** apare și în antetul fișei pacientului.

## Conținutul PDF

| Secțiune | Sursa |
|---|---|
| Antet: clinica, adresa, telefon, email · „Formular 043/e” · data întocmirii | `clinic_settings` |
| Titlu + **nr. fișei** | `patients.record_number` |
| Nume, sex, data nașterii (vârsta), IDNP, adresă, telefon | `patients` |
| 1. Profesia · 2. Diagnosticul · 3. Acuzele · 5. Evoluția bolii · 6. Examenul obiectiv · 8. Date radiologice · 9. Planul de tratament | rânduri goale |
| 4. Boli suportate și concomitente | boli cronice, alergii, medicamente curente + rânduri goale |
| 7. Formula dentară (FDI; la copii și dinții de lapte) | `teeth_status`: **T** tratat, **N** necesită tratament, **A** absent, gol = sănătos |
| 10. Jurnalul vizitelor (cronologic) + 6 rânduri goale | `treatments` cu medicul |
| Semnăturile medicului și pacientului · „Pagina X din Y” pe fiecare pagină | — |

Antetul tabelului din jurnal se repetă pe fiecare pagină. Un rând nu se rupe între două pagini.

## Decizii

| Decizie | Motiv |
|---|---|
| **Numărul fișei e stocat** (`patients.record_number`, unic per clinică) | Un număr calculat la citire s-ar schimba când e șters un pacient. Pacienții existenți au fost numerotați o singură dată, în ordinea creării. Cei noi primesc `max + 1` în aceeași comandă INSERT (`nextRecordNumber`), la ambele locuri de creare: formularul de pacient și pacientul nou din programare. |
| La două salvări simultane cu același număr, se reîncearcă o dată | Indexul unic oprește dublura. Eroarea e recunoscută după numele indexului, ca să nu fie confundată cu „IDNP duplicat”. |
| PDF generat pe server, în Route Handler (`/fise-medicale/[id]/pdf`) | Datele nu ajung în browser decât ca PDF. Verificarea clinicii se face prin `getPatientChart`. `?descarca=1` → `attachment`, altfel `inline`. `Cache-Control: private, no-store`. |
| `@react-pdf/renderer` | Era deja instalat și e pe lista de pachete externalizate automat de Next 16, deci nu cere configurare. |
| Font **Noto Sans** (OFL) în `src/assets/fonts/` | Helvetica, fontul standard din PDF, nu are ș, ț, ă, î, â. |
| Notațiile T / N / A în formula dentară | Avem doar 5 stări ale dinților. Notațiile oficiale complete (C, P, Pt, Pl, K, R, I…) cer stări noi. |

## Logo-ul clinicii
- Se încarcă din **Setări → Clinică** (PNG sau JPG, max. 1 MB). Se salvează imediat, separat de formularul cu datele clinicii.
- Fișierul stă în Supabase Storage, în bucket-ul public `clinic-logos`, în folderul `<clinicId>/`. Bucket-ul se creează automat la prima încărcare. În `clinic_settings.logo_url` rămâne adresa publică. Fiecare încărcare primește un nume nou, ca să nu rămână imaginea veche în cache, iar logo-urile vechi se șterg.
- Tipul fișierului e verificat pe server după primii octeți, nu după extensie. PNG/JPG pentru că `@react-pdf` nu suportă SVG/WebP.
- **Unde apare:** în antetul fișei 043/e, în PDF-ul rapoartelor și în antetul paginii Rapoarte. **Nu** apare în meniu sau în bara de sus, unde rămân logo-ul și numele aplicației MediCare.
- În PDF, logo-ul e descărcat pe server (`loadLogoForPdf`), doar din Storage-ul proiectului. Dacă lipsește sau nu se poate citi, PDF-ul se face fără logo.
- Storage e accesat prin API-ul HTTP (`src/lib/supabase/admin.ts`), nu prin `@supabase/supabase-js`. Clientul complet pornește realtime (WebSocket), care pe Node.js 20 nu există și oprește crearea clientului.

## Fișiere

| Fișier | Rol |
|---|---|
| `src/components/medical-record/medical-record-pdf.tsx` | documentul PDF + `renderMedicalRecordPdf` |
| `src/components/medical-record/dental-formula-pdf.tsx` | formula dentară (refolosește `DENTAL_CHART`) |
| `src/components/medical-record/pdf-fonts.ts` | înregistrarea fontului |
| `src/components/medical-record/medical-record-table.tsx` | tabelul paginii + `medicalRecordHref` |
| `src/app/(dashboard)/fise-medicale/page.tsx` | pagina |
| `src/app/(dashboard)/fise-medicale/[id]/pdf/route.ts` | generarea PDF-ului |
| `src/lib/db/patient-record.ts` | `nextRecordNumber` |

## Abateri de la plan
- `getPatients` întoarce acum pentru fiecare pacient și `lastTreatmentOn`, `treatmentCount`, `totalCost` și `totalPaid`, plus `totals` cu `withTotals: true`. Toate sunt folosite de lista de fișe; lista de pacienți le ignoră.

## Nu intră în acest modul
- Câmpurile de anamneză, acuze, examen obiectiv și plan de tratament în aplicație (acum: rânduri goale)
- Notațiile dentare oficiale complete
- Semnătura electronică
- Arhiva versiunilor PDF generate
- Trimiterea fișei pe email
