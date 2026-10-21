# Notificări și Cont

**Stare:** implementat · **Data planului:** 2026-10-21

## Context
Paginile Setări → Notificări și Setări → Cont erau goale, iar clopoțelul din bara de sus nu făcea nimic.

Decizii luate:
- **Notificări în aplicație**: alerte calculate din date, fără SMS sau email (proiect local, fără furnizori externi).
- **Cont = doar contul meu**: fără gestionarea echipei.

## Notificări

### Ce alerte există
Alertele **nu se salvează și nu se trimit**: se calculează din date la fiecare cerere (`src/lib/db/notification-queries.ts`). O alertă dispare singură când cauza ei e rezolvată.

| Alertă | Când apare | Link |
|---|---|---|
| Programări neconfirmate | azi sau mâine, status `programat`, încă în viitor | calendarul zilei |
| Programări fără status final | ora de sfârșit a trecut, status tot `programat`/`confirmat` | calendarul zilei |
| Datorii vechi | tratamente neachitate (cu preț) mai vechi de **N zile** (implicit 30); suma include doar tratamentele vechi | Rapoarte → Financiar |
| Date incomplete | pacienți activi fără IDNP | Pacienți |
| De rechemat | fără vizită de peste **M luni** (implicit 6) și fără programare viitoare | Rapoarte → Programări |
| Zile de naștere | pacienți activi născuți azi | fișa pacientului |

### Decizii de date
- **Setările țin de utilizator, nu de clinică** (tabelul `notification_settings`, cheie `user_id`). Asistenta și medicul pot alege alerte diferite. Fără rând salvat se folosesc valorile implicite: toate alertele active.
- **„De rechemat” și regula de datorie sunt comune cu rapoartele** (`getRecallPatients`, `UNPAID` din `sql-helpers.ts`), deci alerta și raportul dau aceleași cifre.
- **Clopoțelul nu încetinește paginile.**
  - `(dashboard)/layout.tsx` pornește `getNotifications()` fără `await`.
  - Clopoțelul citește rezultatul cu `use()`, într-un `<Suspense>`.
  - Dacă alertele dau eroare, clopoțelul rămâne gol (`.catch`), iar pagina merge mai departe.
- **Bulina** arată numărul total de cazuri (peste 9: „9+”). Fără alerte, nu apare.

### Fișiere
- `src/lib/db/schema.ts`: `notificationSettings`
- `src/lib/db/notification-queries.ts`
- `src/lib/actions/notifications.ts`
- `src/lib/validations/notifications.ts`
- `src/components/notifications/`: `notification-bell.tsx`, `notification-list.tsx`, `notification-settings-form.tsx`
- `src/app/(dashboard)/setari/notificari/page.tsx`

## Cont
1. **Profil**: numele și telefonul se pot schimba. Rolul și clinica doar se afișează. Numele nou apare imediat și în meniu (`revalidatePath('/', 'layout')`).
1. **Email de login** (adăugat după implementare, la cererea utilizatorului):
   - cere emailul nou și parola curentă;
   - schimbarea se aplică imediat, fără email de confirmare (`authAdmin.updateEmail` din `src/lib/supabase/admin.ts`, API-ul de administrare Supabase);
   - tabelul `users` și Supabase Auth se modifică într-o tranzacție: dacă Supabase refuză, nici `users` nu se schimbă;
   - o adresă deja folosită primește mesajul „Există deja un cont cu acest email” (Supabase răspunde cu codul `23505`).
2. **Schimbă parola**:
   - întâi se verifică parola curentă (`signInWithPassword`), apoi se salvează cea nouă (`updateUser`);
   - mesajele sunt în română și apar sub câmpul greșit.
3. **Securitate**: „Deconectează-mă de pe toate dispozitivele” (`signOut({ scope: 'global' })`), cu dialog de confirmare.
   - **Limită:** tokenul e verificat local (`getClaims`), deci pe celelalte dispozitive rămâne valid până expiră, cel mult 1 oră. Sesiunea nu se mai poate reînnoi.

Dialogul de confirmare comun a devenit `ConfirmDialog` (`src/components/confirm-dialog.tsx`):
- butonul implicit e „Șterge”, deci toate ștergerile îl folosesc ca până acum;
- textul butonului se poate schimba (aici e „Deconectează”).

### Fișiere
- `src/lib/actions/account.ts`
- `src/lib/validations/account.ts`
- `src/lib/constants/user-roles.ts`
- `src/components/settings/`: `profile-form.tsx`, `email-form.tsx`, `password-form.tsx`, `security-card.tsx`
- `src/app/(dashboard)/setari/cont/page.tsx`

## Verificat
- **Alertele** (script pe o clinică temporară, ștearsă la final; apelează funcțiile aplicației):
  - fiecare dintre cele 6 alerte numără exact cazul pregătit;
  - programările confirmate sau finalizate și datoriile noi nu apar;
  - pragul de 60 de zile scoate alerta de datorii, iar cel de 8 luni pe cea de rechemare;
  - cu toate alertele dezactivate, lista e goală;
  - rechemarea e identică cu tabelul din raport.
- **Contul** (utilizator temporar, șters la final):
  - parola curentă greșită e respinsă;
  - aceeași parolă dă `same_password`;
  - după schimbare, parola veche nu mai merge;
  - după deconectarea globală, alt dispozitiv nu-și mai poate reînnoi sesiunea.
- `tsc`, `eslint`, `next build` fără erori.

## Nu intră în acest modul
- SMS sau email către pacienți ori utilizatori.
- Gestionarea echipei (conturi, roluri).
- Poza de profil.
- Confirmarea noului email printr-un link trimis pe email (schimbarea se face direct, după parola curentă).
- Alerte marcate „citite” sau ascunse.
