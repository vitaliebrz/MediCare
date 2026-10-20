import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    boolean,
    decimal,
    date,
    time,
    pgEnum,
    uniqueIndex,
    index
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ===========================================
// ENUM-uri (tippuri fixe)
//============================================

export const patienCategoryEnum = pgEnum('patient_category', ['adult', 'copil']);
export const patientStatusEnum = pgEnum('patient_status', ['activ', 'inactiv']);
export const toothStatusEnum = pgEnum('tooth_status', [
    'sanatos',
    'tratat',
    'necesita_tratament',
    'extras',
    'cazut_natural'
]);
export const userRoleEnum = pgEnum('user_role', ['admin', 'medic', 'asistent']);
export const genderEnum = pgEnum('gender', ['M', 'F']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['programat', 'confirmat', 'finalizat', 'anulat', 'neprezentat']);

//============================================
// Tabel: Clinics (fiecare clinică = un "tenant")
// Toate celelalte tabele au clinic_id spre acest tabel.
// Detaliile (nume, adresă etc.) sunt în clinic_settings.
//============================================

export const clinics = pgTable('clinics', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

// Coloana comună pentru tabelele care aparțin unei clinici
const clinicId = () => uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' });

//============================================
// Tabel: Users (medic + asistente + admin)
// Legat cu Supabase Auth prin ID
//============================================

export const users = pgTable('users', {
    id: uuid('id').primaryKey(), // vine din auth.users.id (Supabase Auth)
    clinicId: clinicId(),
    email: text('email').notNull().unique(),
    fullName: text('full_name').notNull(),
    role: userRoleEnum('role').notNull().default('medic'),
    phone: text('phone'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

// ==========================================
// Tabel: Patients (pacienți)
// ==========================================

export const patients = pgTable('patients', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId(),

    // Info personale
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    birthDate: date('birth_date'),
    gender: genderEnum('gender'),
    address: text('address'),
    // IDNP (Moldova), 13 cifre. null = pacient creat rapid dintr-o programare (doar nume + telefon);
    // fișa lui apare ca „Date incomplete” până se completează din formularul de pacient, unde IDNP e obligatoriu.
    idnp: text('idnp'),
    // Numărul fișei medicale (Formular 043/e): 1, 2, 3... per clinică, atribuit la crearea pacientului.
    // Stocat (nu calculat la citire), ca să nu se schimbe când alt pacient e șters.
    recordNumber: integer('record_number'),

    // Category
    category: patienCategoryEnum('category').notNull().default('adult'),
    status: patientStatusEnum('status').notNull().default('activ'),

    // Info medicale
    alergie: text('allergies'),
    chronicDiseases: text('chronic_diseases'),
    currentMedications: text('current_medications'),
    bloodType: text('blood_type'),

    // Note generale
    notes: text('notes'),

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
}, (table) => [
    // Același IDNP nu poate apărea de două ori în aceeași clinică (dar poate în clinici diferite)
    uniqueIndex('patients_clinic_id_idnp_unique').on(table.clinicId, table.idnp),
    uniqueIndex('patients_clinic_id_record_number_unique').on(table.clinicId, table.recordNumber),
]).enableRLS()

// ===================================================
// Table: Treatments (istoric tratamente per dinte)
// ===================================================

export const treatments = pgTable('treatments', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId(),
    patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),

    // Numărul dintelui în notația FDI (11-48 adulți, 51-85 copii).
    // null = tratament general, nelegat de un dinte (consultație, detartraj, radiografie)
    toothNumber: integer('tooth_number'),

    // Cine a făcut tratamentul și ce serviciu din lista de prețuri.
    // set null: dacă medicul/serviciul e șters, tratamentul rămâne în istoric
    doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
    serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),

    // Detalii tratament
    diagnosis: text('diagnosis').notNull(),  //"Carie mesiala"
    treatmentDescription: text('treatment_description').notNull(),
    recomendations: text('recomendations'),

    // Financiar - prețul e copiat din serviciu în momentul tratamentului,
    // ca să nu se schimbe istoricul dacă se modifică lista de prețuri
    price: decimal('price', { precision: 10, scale: 2 }),
    paid: boolean('paid').notNull().default(false),
    // Când a fost achitat (null = neachitat). Folosit în dashboard pentru Venit și Datorii pe perioadă.
    paidAt: timestamp('paid_at', { withTimezone: true }),

    // Metadata
    performedAt: date('performed_at').notNull().default(sql`CURRENT_DATE`), // ziua tratamentului
    performedBy: uuid('performed_by').references(() => users.id), // utilizatorul care l-a înregistrat
    createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

// ========================================================
// Table: TEETH_STATUS (starea curenta a fiecarui dinte)
// Pentru schema dentara vizuala
// ========================================================

export const teethStatus = pgTable('teeth_status', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId(),
    patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    toothNumber: integer('tooth_number').notNull(),
    status: toothStatusEnum('status').notNull().default('sanatos'),
    notes: text('notes'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    // Un singur rând de stare pentru fiecare dinte al unui pacient (actualizat prin upsert).
    // Dinții fără rând sunt considerați sănătoși.
    uniqueIndex('teeth_status_patient_id_tooth_number_unique').on(table.patientId, table.toothNumber),
]).enableRLS()

// ====================================================
// Tabel: SERVICES (lista serviciilor cu tarife)
// ====================================================

export const services = pgTable('services', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId(),
    name: text('name').notNull(), // "Extractie dentara"
    categoryId: uuid( 'category_id').references(()=> categories.id).notNull(), //"Terapie", "Chirurgie", "Protezare"
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(), //durata estimata
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

// ====================================================
// Tabel: CLINIC_SETTINGS (setari cabinet)
// ====================================================

export const clinicSettings = pgTable('clinic_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId().unique(), // o clinică are un singur set de setări
    clinicName: text('clinic_name').notNull(),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    logoUrl: text('logo_url'),
    workingHours: text('working_hours'), //"Luni-Vineri 8:00-18:00"
    // Intervalul afișat în calendarul de programări (Postgres întoarce '08:00:00')
    dayStart: time('day_start').notNull().default('08:00'),
    dayEnd: time('day_end').notNull().default('20:00'),
    currency: text('curency').notNull().default('MDL'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

// ====================================================
// Tabel: Categorii (categoriile din care fac parte serviciile)
// ====================================================

export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
}).enableRLS()

// ====================================================
// Tabelul: Medici
// ====================================================
export const doctorColorEnum = pgEnum('doctor_color', [
    'blue', 'green', 'purple', 'orange', 'pink', 'teal'
])
export const doctors = pgTable('doctors', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    categoryId: uuid('category_id').references(() => categories.id).notNull(),
    phone: text('phone'),
    email: text('email'),
    hireDate: date('hire_date'),
    active: boolean('active').notNull().default(true),
    color: doctorColorEnum('color').notNull().default('teal'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

// ====================================================
// Tabel: APPOINTMENTS (programări)
// Afișate în calendarul de pe /programari și în „Programări azi” din dashboard.
// ====================================================
export const appointments = pgTable('appointments', {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: clinicId(),
    patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
    // Procedura e obligatorie în formular; set null: programarea rămâne dacă serviciul e șters
    serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
    // timestamptz: momentul exact; afișarea se face în ora Chișinăului
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    // Copiată din services.duration_minutes la salvare (ca prețul la tratamente):
    // dacă durata serviciului se schimbă în setări, programările deja făcute nu se mută
    durationMinutes: integer('duration_minutes').notNull().default(30),
    reason: text('reason'),
    notes: text('notes'),
    status: appointmentStatusEnum('status').notNull().default('programat'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    // Dashboard-ul și calendarul caută programările unei clinici într-un interval de timp
    index('appointments_clinic_id_starts_at_idx').on(table.clinicId, table.startsAt),
]).enableRLS()

// ====================================================
// RELATII (pentru queri-uri complexe)
// ====================================================

export const patientRelations = relations(patients, ({ many, one }) => ({
    treatments: many(treatments),
    teethStatus: many(teethStatus),
    createdBy: one(users, {
        fields: [patients.createdBy],
        references: [users.id],
    }),
}));

export const treatmentsRelations = relations(treatments, ({ one }) => ({
    patient: one(patients, {
        fields: [treatments.patientId],
        references: [patients.id],
    }),
    doctor: one(doctors, {
        fields: [treatments.doctorId],
        references: [doctors.id],
    }),
    service: one(services, {
        fields: [treatments.serviceId],
        references: [services.id],
    }),
}));

export const teethStatusRelations = relations(teethStatus, ({ one }) => ({
    patient: one(patients, {
        fields: [teethStatus.patientId],
        references: [patients.id],
    }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
    patient: one(patients, {
        fields: [appointments.patientId],
        references: [patients.id],
    }),
    doctor: one(doctors, {
        fields: [appointments.doctorId],
        references: [doctors.id],
    }),
    service: one(services, {
        fields: [appointments.serviceId],
        references: [services.id],
    }),
}));

// ====================================================
// TYPES pentru TypeScript (auto-generare)
// ====================================================

export type Clinic = typeof clinics.$inferSelect;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Treatment = typeof treatments.$inferSelect;
export type NewTreatment = typeof treatments.$inferInsert;

export type ToothStatus = typeof teethStatus.$inferSelect;
export type NewToothStatus = typeof teethStatus.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type ClinicSettings = typeof clinicSettings.$inferSelect
export type Category = typeof categories.$inferSelect;

export type Appointment = typeof appointments.$inferSelect;
export type AppointmentStatus = (typeof appointmentStatusEnum.enumValues)[number];
export type ToothStatusValue = (typeof toothStatusEnum.enumValues)[number];
export type Color = (typeof doctorColorEnum.enumValues)[number];
export type Doctors = typeof doctors.$inferSelect;