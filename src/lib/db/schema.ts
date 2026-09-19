import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    boolean,
    decimal,
    date,
    pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { time } from 'console';
import { id } from 'date-fns/locale';

// ===========================================
// ENUM-uri (tippuri fixe)
//============================================

export const patienCategoryEnum = pgEnum('patient_category', ['adult', 'copil']);
export const patientStatusEnum = pgEnum('patient_status', ['activ', 'incativ']);
export const toothStatusEnum = pgEnum('tooth_status', [
    'sanatos',
    'tratat',
    'necesita_tratament',
    'extras',
    'cazut_natural'
]);
export const userRoleEnum = pgEnum('user_role', ['admin', 'medic', 'asistent']);
export const genderEnum = pgEnum('gender', ['M', 'F']);
//============================================
// Tabel: Users (medic + asistente + admin)
// Legat cu Supabase Auth prin ID
//============================================

export const users = pgTable('users', {
    id: uuid('id').primaryKey(), // vine din auth.users.id (Supabase Auth)
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

    // Info personale
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    email: text('email'),
    birthDate: date('birth_date'),
    gender: genderEnum('gender'),
    address: text('address'),
    idnp: text('idnp'), // IDNP(Moldova)

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
}).enableRLS()

// ===================================================
// Table: Treatments (istoric tratamente per dinte)
// ===================================================

export const treatments = pgTable('treatments', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),

    // Numărul dintelui (11-48 pentru adulți, 52-85 pentru copii)
    toothNumber: integer('tooth_number').notNull(),

    // Detalii tratament
    diagnosis: text('diagnosis').notNull(),  //"Carie mesiala"
    treatmentDescription: text('treatment_description').notNull(),
    recomendations: text('recomendations'),

    // Financiar
    price: decimal('price', { precision: 10, scale: 2 }),
    paid: boolean('paid').notNull().default(false),

    // Metadata
    performedAt: timestamp('performed_at').defaultNow().notNull(),
    performedBy: uuid('performed_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

// ========================================================
// Table: TEETH_STATUS (starea curenta a fiecarui dinte)
// Pentru schema dentara vizuala
// ========================================================

export const teethStatus = pgTable('teeth_status', {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }),
    toothNumber: integer('tooth_number').notNull(),
    status: toothStatusEnum('status').notNull().default('sanatos'),
    notes: text('notes'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

// ====================================================
// Tabel: SERVICES (lista serviciilor cu tarife)
// ====================================================

export const services = pgTable('services', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(), // "Extractie dentara"
    category: text('category').notNull(), //"Terapie", "Chirurgie", "Protezare"
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
    clinicName: text('clinic_name').notNull(),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    logoUrl: text('logo_url'),
    workingHours: text('working_hours'), //"Luni-Vineri 8:00-18:00"
    currency: text('curency').notNull().default('MDL'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

// ====================================================
// Tabel: Categorii (categoriile din care fac parte serviciile)
// ====================================================

export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
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
// RELATII (pentru queri-uri complexe)
// ====================================================

export const patientRelations = relations(patients, ({ many, one }) => ({
    reatments: many(treatments),
    teethStatus: many(teethStatus),
    createdBy: one(users, {
        fields: [patients.createdBy],
        references: [users.id],
    }),
}));

export const treatmentsRelations = relations(teethStatus, ({ one }) => ({
    patient: one(patients, {
        fields: [teethStatus.patientId],
        references: [patients.id],
    }),
}));



// ====================================================
// TYPES pentru TypeScript (auto-generare)
// ====================================================

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

export type Color = (typeof doctorColorEnum.enumValues)[number];
export type Doctors = typeof doctors.$inferSelect;