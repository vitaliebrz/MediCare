import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { PDF_FONT } from './pdf-fonts';
import { DentalFormulaPdf } from './dental-formula-pdf';
import { formatDate } from '@/lib/format';
import { calculateAge } from '@/lib/patient-age';
import type { ClinicSettings, ToothStatusValue } from '@/lib/db/schema';
import type { PatientChart } from '@/lib/actions/treatments';
import type { Dentition } from '@/lib/teeth';
import type { LogoFormat } from '@/lib/clinic-logo';

// Fișa medicală a bolnavului stomatologic — Formular 043/e (structura standard).
// Secțiunile fără date în aplicație se tipăresc cu rânduri goale, de completat de mână.
// Vezi docs/plans/fise-medicale.md.

const BLANK_JOURNAL_ROWS = 6; // rânduri goale în jurnal, pentru vizitele următoare

const styles = StyleSheet.create({
    page: { fontFamily: PDF_FONT, fontSize: 9, paddingTop: 32, paddingBottom: 48, paddingHorizontal: 36, color: '#111' },
    header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#111', paddingBottom: 6 },
    clinicName: { fontSize: 11, fontWeight: 'bold' },
    clinicBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: { width: 44, height: 44, objectFit: 'contain' },
    small: { fontSize: 8, color: '#444' },
    formCode: { fontSize: 8, textAlign: 'right' },
    title: { marginTop: 12, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { marginTop: 2, marginBottom: 10, fontSize: 9, textAlign: 'center' },
    section: { marginTop: 8 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 2 },
    fieldRow: { flexDirection: 'row', flexWrap: 'wrap' },
    field: { flexDirection: 'row', width: '50%', marginBottom: 3 },
    fieldLabel: { color: '#444', marginRight: 4 },
    fieldValue: { fontWeight: 'bold', flex: 1, borderBottomWidth: 0.5, borderBottomColor: '#999' },
    blankLine: { height: 15, borderBottomWidth: 0.5, borderBottomColor: '#999', borderBottomStyle: 'dotted' },
    filledText: { borderBottomWidth: 0.5, borderBottomColor: '#999', paddingBottom: 1, marginBottom: 2 },
    table: { borderWidth: 0.5, borderColor: '#666', marginTop: 2 },
    tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#999', minHeight: 16 },
    th: { padding: 2, fontWeight: 'bold', fontSize: 8, backgroundColor: '#eee', borderRightWidth: 0.5, borderRightColor: '#999' },
    td: { padding: 2, fontSize: 8, borderRightWidth: 0.5, borderRightColor: '#999' },
    signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
    signature: { width: '45%', borderTopWidth: 0.5, borderTopColor: '#111', paddingTop: 2, fontSize: 8, color: '#444', textAlign: 'center' },
    footer: { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#777' },
});

// Coloanele jurnalului vizitelor (lățimi fixe, „Tratament efectuat” ia restul)
const JOURNAL_COLUMNS = [
    { key: 'date', label: 'Data', width: 48 },
    { key: 'tooth', label: 'Dinte', width: 30 },
    { key: 'diagnosis', label: 'Diagnostic', width: 90 },
    { key: 'treatment', label: 'Tratament efectuat', flex: 1 },
    { key: 'recommendations', label: 'Recomandări', width: 80 },
    { key: 'doctor', label: 'Medic', width: 70 },
    { key: 'signature', label: 'Semnătura', width: 50 },
] as const;
type JournalKey = (typeof JOURNAL_COLUMNS)[number]['key'];

const columnStyle = (column: (typeof JOURNAL_COLUMNS)[number]) => ('flex' in column ? { flex: column.flex } : { width: column.width });

const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}:</Text>
        <Text style={styles.fieldValue}>{value || ' '}</Text>
    </View>
);

const BlankLines = ({ count }: { count: number }) => (
    <>{Array.from({ length: count }, (_, index) => <View key={index} style={styles.blankLine} />)}</>
);

// O secțiune numerotată. Textul existent (dacă există) e scris, apoi urmează rânduri goale.
const Section = ({ number, title, lines = 2, children }: { number: number; title: string; lines?: number; children?: React.ReactNode }) => (
    <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>{number}. {title}</Text>
        {children}
        <BlankLines count={lines} />
    </View>
);

interface MedicalRecordPdfProps {
    chart: PatientChart;
    clinic: ClinicSettings | null;
    issuedOn: string; // 'YYYY-MM-DD', ziua generării, în ora Chișinăului
    logo?: { data: Buffer; format: LogoFormat } | null; // logo-ul clinicii, deja descărcat
}

export const MedicalRecordPdf = ({ chart, clinic, issuedOn, logo }: MedicalRecordPdfProps) => {
    const { patient, teeth, treatments } = chart;
    const age = calculateAge(patient.birthDate);
    const statuses = new Map<number, ToothStatusValue>(teeth.map((tooth) => [tooth.toothNumber, tooth.status]));
    // La copii: și dinții de lapte. Dacă un adult are stări pe dinți de lapte (rar), îi arătăm și pe aceia.
    const hasChildTeeth = teeth.some((tooth) => tooth.toothNumber >= 51);
    const dentitions: Dentition[] = patient.category === 'copil' || hasChildTeeth ? ['adult', 'copil'] : ['adult'];
    // Jurnalul în ordine cronologică (fișa pacientului le are de la cel mai nou)
    const journal = [...treatments].reverse();
    const history = [
        patient.chronicDiseases && `Boli cronice: ${patient.chronicDiseases}`,
        patient.alergie && `Alergii: ${patient.alergie}`,
        patient.currentMedications && `Medicamente curente: ${patient.currentMedications}`,
    ].filter(Boolean) as string[];

    const cell = (treatment: (typeof journal)[number], key: JournalKey) => {
        switch (key) {
            case 'date': return formatDate(treatment.performedAt);
            case 'tooth': return treatment.toothNumber ? String(treatment.toothNumber) : 'gen.';
            case 'diagnosis': return treatment.diagnosis;
            case 'treatment': return treatment.treatmentDescription;
            case 'recommendations': return treatment.recomendations ?? '';
            case 'doctor': return treatment.doctorName ? `${treatment.doctorName} ${treatment.doctorFirstName ?? ''}` : '';
            case 'signature': return '';
        }
    };

    const fullName = `${patient.lastName} ${patient.firstName}`;
    const recordNumber = patient.recordNumber ?? '____';

    return (
        <Document title={`Fișa medicală nr. ${recordNumber} — ${fullName}`} author={clinic?.clinicName ?? undefined} language='ro'>
            <Page size='A4' style={styles.page}>
                {/* Antet */}
                <View style={styles.header}>
                    <View style={styles.clinicBlock}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image din react-pdf, nu <img> HTML */}
                        {logo && <Image src={logo} style={styles.logo} />}
                        <View>
                            <Text style={styles.clinicName}>{clinic?.clinicName ?? 'Instituția medicală'}</Text>
                            {clinic?.address && <Text style={styles.small}>{clinic.address}</Text>}
                            {(clinic?.phone || clinic?.email) && (
                                <Text style={styles.small}>{[clinic?.phone, clinic?.email].filter(Boolean).join(' · ')}</Text>
                            )}
                        </View>
                    </View>
                    <View>
                        <Text style={styles.formCode}>Formular 043/e</Text>
                        <Text style={styles.formCode}>Data întocmirii: {formatDate(issuedOn)}</Text>
                    </View>
                </View>

                <Text style={styles.title}>FIȘA MEDICALĂ A BOLNAVULUI STOMATOLOGIC</Text>
                <Text style={styles.subtitle}>nr. {recordNumber}</Text>

                {/* Date personale */}
                <View style={styles.fieldRow}>
                    <Field label='Numele, prenumele' value={fullName} />
                    <Field label='Sexul' value={patient.gender === 'M' ? 'masculin' : patient.gender === 'F' ? 'feminin' : null} />
                    <Field label='Data nașterii' value={patient.birthDate ? `${formatDate(patient.birthDate)}${age !== null ? ` (${age} ani)` : ''}` : null} />
                    <Field label='IDNP' value={patient.idnp} />
                    <Field label='Adresa' value={patient.address} />
                    <Field label='Telefon' value={patient.phone} />
                </View>

                <Section number={1} title='Profesia, locul de muncă' lines={1} />
                <Section number={2} title='Diagnosticul' lines={2} />
                <Section number={3} title='Acuzele' lines={2} />
                <Section number={4} title='Boli suportate și concomitente' lines={history.length > 0 ? 1 : 2}>
                    {history.map((line) => <Text key={line} style={styles.filledText}>{line}</Text>)}
                </Section>
                <Section number={5} title='Evoluția bolii actuale' lines={2} />
                <Section number={6} title='Examenul obiectiv (exobucal, endobucal), ocluzia, starea mucoasei, igiena cavității bucale' lines={3} />

                <View style={styles.section} wrap={false}>
                    <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>7. Formula dentară</Text>
                    <DentalFormulaPdf dentitions={dentitions} statuses={statuses} />
                </View>

                <Section number={8} title='Date radiologice și de laborator' lines={2} />
                <Section number={9} title='Planul de tratament' lines={3} />

                {/* Jurnalul vizitelor */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} minPresenceAhead={40}>10. Jurnalul vizitelor</Text>
                    <View style={styles.table}>
                        {/* fixed: antetul coloanelor se repetă pe fiecare pagină pe care continuă tabelul */}
                        <View style={styles.tr} wrap={false} fixed>
                            {JOURNAL_COLUMNS.map((column) => (
                                <Text key={column.key} style={[styles.th, columnStyle(column)]}>{column.label}</Text>
                            ))}
                        </View>
                        {journal.map((treatment) => (
                            // wrap={false}: un rând nu se rupe între două pagini
                            <View key={treatment.id} style={styles.tr} wrap={false}>
                                {JOURNAL_COLUMNS.map((column) => (
                                    <Text key={column.key} style={[styles.td, columnStyle(column)]}>{cell(treatment, column.key)}</Text>
                                ))}
                            </View>
                        ))}
                        {Array.from({ length: BLANK_JOURNAL_ROWS }, (_, index) => (
                            <View key={`blank-${index}`} style={styles.tr} wrap={false}>
                                {JOURNAL_COLUMNS.map((column) => <Text key={column.key} style={[styles.td, columnStyle(column)]}> </Text>)}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.signatures} wrap={false}>
                    <Text style={styles.signature}>Semnătura medicului curant</Text>
                    <Text style={styles.signature}>Semnătura pacientului (acord pentru tratament)</Text>
                </View>

                {/* Subsol pe fiecare pagină */}
                <View style={styles.footer} fixed>
                    <Text>Fișa nr. {recordNumber} · {fullName}</Text>
                    <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} din ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
};

// Fișa gata generată, ca Buffer (pentru Route Handler-ul care o trimite browserului)
export const renderMedicalRecordPdf = (props: MedicalRecordPdfProps) => renderToBuffer(<MedicalRecordPdf {...props} />);
