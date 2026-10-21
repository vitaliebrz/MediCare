# Programări (`/programari`)

**Stare:** implementat · **Data planului:** 2026-10-19

Calendarul programărilor clinicii: vizualizare pe săptămână sau pe zi, creare din click pe un slot gol, editare/ștergere din click pe programare. Calendarul e construit de noi (Tailwind + funcții proprii), fără bibliotecă externă: arată ca restul aplicației și nu adaugă o dependență grea.

## Structura paginii

```
Programări
[‹] [Azi] [›]  19 – 25 octombrie 2026   [Zi | Săptămână] [Toți medicii ▾] [+ Programare nouă]
┌──────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┬─────┐
│      │ Lu 19   │ Ma 20   │ Mi 21   │ Jo 22   │ Vi 23   │ Sâ  │ Du  │
│ 08:00│┌───────┐│         │         │         │         │     │     │
│      ││09:00– ││         │         │         │         │     │     │
│ 09:00││Popescu││         │         │         │         │     │     │
│ 10:00│─────────── linie roșie = acum ───────────────────│     │     │
└──────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┴─────┘
```

- **Săptămână:** 7 coloane, luni–duminică. Click pe antetul unei zile → vizualizarea Zi.
- **Zi:** câte o coloană pentru fiecare medic activ (+ medicii inactivi care au programări în ziua respectivă, + „Fără medic” dacă există programări fără medic).
- Starea e în URL: `?vedere=zi&data=2026-10-19&medic=<id>`. Valorile implicite (săptămâna, azi, toți medicii) nu apar în URL; o valoare invalidă devine cea implicită.
- Pe telefon grila se derulează în interiorul cardului, iar antetul și coloana orelor rămân fixe.

## Decizii

| Decizie | Motiv |
|---|---|
| **Procedura e obligatorie**, iar durata se ia din Setări → Servicii | Durata reală a vizitei depinde de procedură; recepția nu trebuie s-o ghicească. |
| Durata e **copiată** în `appointments.duration_minutes` la salvare | Ca prețul la tratamente: dacă durata serviciului se schimbă, programările deja făcute nu se mută în calendar. La editare se recalculează doar dacă se schimbă procedura. |
| Durata nu vine niciodată din browser | Serverul citește serviciul și scrie durata. Formularul doar o afișează („Durată: 45 min · se termină la 10:15”). |
| Intervalul grilei vine din `clinic_settings.day_start` / `day_end` | Setabil din Setări → Clinică, ca **„Program de lucru”**. Vechiul câmp text `working_hours` a fost șters, iar programul de lucru și intervalul calendarului sunt acum același lucru. Dacă există programări în afara lui, grila se lărgește ca să nu fie ascunse. |
| Conversia oră locală → `timestamptz` se face în Postgres | `('2026-10-26 09:00')::timestamp at time zone 'Europe/Chisinau'` ține cont de ora de vară și nu depinde de fusul serverului. |
| **Conflict:** același medic nu poate avea două programări ne-anulate suprapuse | Mesaj: „Dr. X are deja o programare la 10:00–10:30.” La medici diferiți, suprapunerea e permisă și programările apar una lângă alta. |
| **Culoarea blocului = medicul, eticheta colorată = statusul** | Fiecare programare are o etichetă de status (`StatusBadge`: iconiță + text, culoarea din `appointment-status.ts`), aceeași în calendar, legendă, formular și dashboard. În blocurile înguste rămâne doar iconița colorată (container queries). Anulat e și estompat/tăiat, Neprezentat are chenar portocaliu. Sub calendar e o legendă cu medicii și toate statusurile. |
| Click pe slot → ora rotunjită în jos la 15 minute | Grilă de 64 px/oră, linii pline la ore și punctate la jumătate de oră. |
| Linia „acum” se calculează doar în browser (`useSyncExternalStore`) | Pe server ora e necunoscută; altfel HTML-ul de pe server n-ar coincide cu cel din browser. |

## Pacient nou direct din programare

Recepția nu trebuie să creeze întâi fișa pacientului. În formularul de programare, la „Pacient”, cauți în listă sau apeși **„Pacient nou”**. Atunci se cer doar **nume, prenume și telefon**, cu aceleași reguli ca în fișa pacientului (`patientSchema.pick`). Ce ai scris deja în căutare devine punctul de plecare: cifrele merg în telefon, iar textul „Popescu Ion” se împarte în nume și prenume.

- Serverul creează pacientul și programarea **într-o singură tranzacție**: ori se salvează amândouă, ori niciuna.
- `patients.idnp` e opțional în baza de date. **Fără IDNP = „Date incomplete”**, deci nu e nevoie de o coloană separată. Indexul unic `(clinic_id, idnp)` rămâne valabil, pentru că Postgres nu consideră duplicate mai multe valori NULL.
- Completarea datelor se cere în **fișa pacientului**, printr-un banner galben cu butonul „Completează datele”. În **lista de pacienți** apare eticheta „Date incomplete” în coloana IDNP.
- Formularul complet de pacient cere în continuare IDNP-ul, deci la completare acesta devine obligatoriu.

## Legătura cu tratamentele

- **„Tratament nou” se completează din programare** (`getTreatmentPrefill`). Dacă pacientul are o programare **nefinalizată** (Programat / Confirmat) azi sau în trecut, se ia cea de azi, apoi cea mai apropiată de ora curentă. Din ea se completează **data**, **medicul** și **procedura**; procedura aduce și prețul și descrierea, ca la alegerea ei din listă. Motivul vizitei și notele apar într-o casetă de informare sus în formular. Nu sunt copiate în „Diagnostic”, pentru că motivul spus de pacient nu e un diagnostic. E aceeași programare pe care salvarea o marchează „Finalizat”. Dacă nu există o programare nefinalizată, se propune doar medicul din cea mai recentă programare (fără anulate / neprezentate). Medicii și serviciile inactive nu se propun.
- **Tratament nou → programarea devine „Finalizat”.** Se finalizează programarea pacientului din ziua tratamentului care e încă „Programat”/„Confirmat”. Dacă sunt mai multe, are prioritate cea cu același medic, apoi cea mai apropiată de ora curentă. Se finalizează o singură programare, în aceeași tranzacție cu tratamentul (`finishAppointmentFor` din `actions/treatments.ts`). Mesajul de confirmare spune ce programare a fost finalizată. Editarea sau ștergerea unui tratament nu schimbă statusul programării.

## Fișiere

| Fișier | Rol |
|---|---|
| `src/lib/db/schema.ts` | `clinic_settings.day_start/day_end`, `appointments.service_id`, relații |
| `src/lib/validations/appointment.ts` | validarea formularului (fără durată) |
| `src/lib/actions/appointments.ts` | citire pe interval, căutare pacienți, creare, editare, ștergere, verificare conflict |
| `src/lib/db/patient-search.ts` | condiția de căutare a pacienților, comună cu lista de pacienți |
| `src/lib/calendar.ts` | funcții pure: vizualizarea din URL, ore ↔ minute, așezarea programărilor suprapuse |
| `src/lib/constants/appointment-status.ts` | etichetele statusurilor, comune cu dashboard-ul |
| `src/components/appointments/*` | bara de navigare, grila, blocul programării, formularul |
| `src/app/(dashboard)/programari/page.tsx` | pagina (Server Component) |

## Abateri de la plan
- Câmpul „Pacient” e un input de căutare cu listă de rezultate (minim 2 litere, max 10 pacienți activi), nu `Command` în `Popover`. E mai simplu și merge bine într-un dialog.
- Nu există o acțiune separată pentru schimbarea statusului: statusul se schimbă din formular, care face și verificarea de conflict.
- Butonul „Programare nouă” stă în bara de navigare (componentă client), deci nu a mai fost nevoie de `new-appointment-button.tsx`.

## Nu intră în acest modul
- Drag & drop pentru mutarea programărilor (etapă separată)
- Vizualizările Lună și Listă
- Programări recurente
- Notificări / SMS de reamintire
- Programare online făcută de pacient
