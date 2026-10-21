import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// În `next dev`, fiecare modificare de cod reîncarcă acest modul. Fără globalThis s-ar crea de fiecare dată
// un client nou, cu conexiuni noi (prima conexiune durează ~600 ms: TLS + autentificare la pooler).
// Păstrăm clientul între reîncărcări. În producție modulul se încarcă o singură dată, deci nu contează.
const globalForDb = globalThis as unknown as { postgresClient?: ReturnType<typeof postgres> };

const client = globalForDb.postgresClient ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== 'production') globalForDb.postgresClient = client;

export const db = drizzle(client, { schema });
