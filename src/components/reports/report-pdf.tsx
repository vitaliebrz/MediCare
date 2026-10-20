import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { PDF_FONT } from '@/components/medical-record/pdf-fonts';
import { formatDate } from '@/lib/format';
import { formatCell, isNumeric } from '@/lib/reports/format';
import type { ReportBase, ReportColumn, ReportTable } from '@/lib/reports/types';
import type { ClinicSettings } from '@/lib/db/schema';
import type { LogoFormat } from '@/lib/clinic-logo';

// PDF-ul unui raport: antet, cifrele-cheie și toate tabelele, din aceeași descriere ca pagina și CSV-ul.
// Graficele nu intră: la printare, tabelele cu cifre sunt mai utile.

const styles = StyleSheet.create({
    page: { fontFamily: PDF_FONT, fontSize: 8.5, paddingTop: 28, paddingBottom: 40, paddingHorizontal: 30, color: '#111' },
    header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#111', paddingBottom: 6 },
    clinicName: { fontSize: 10, fontWeight: 'bold' },
    clinicBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: { width: 36, height: 36, objectFit: 'contain' },
    small: { fontSize: 7.5, color: '#555' },
    title: { marginTop: 10, fontSize: 14, fontWeight: 'bold' },
    subtitle: { marginTop: 2, fontSize: 9, color: '#444' },
    kpis: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
    kpi: { width: '19%', borderWidth: 0.5, borderColor: '#bbb', borderRadius: 3, padding: 5 },
    kpiLabel: { fontSize: 7.5, color: '#555' },
    kpiValue: { fontSize: 11, fontWeight: 'bold', marginTop: 1 },
    kpiHint: { fontSize: 6.5, color: '#777', marginTop: 1 },
    section: { marginTop: 14 },
    sectionTitle: { fontSize: 10, fontWeight: 'bold' },
    sectionDescription: { fontSize: 7.5, color: '#555', marginBottom: 3 },
    table: { borderWidth: 0.5, borderColor: '#888', marginTop: 3 },
    tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#bbb' },
    th: { padding: 3, fontWeight: 'bold', fontSize: 7.5, backgroundColor: '#eee' },
    td: { padding: 3 },
    bold: { fontWeight: 'bold', backgroundColor: '#f4f4f4' },
    empty: { fontSize: 8, color: '#666', marginTop: 3 },
    footer: { position: 'absolute', bottom: 18, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#777' },
});

// Prima coloană (de obicei un nume) e mai lată; restul își împart spațiul
const cellStyle = (column: ReportColumn, index: number) => ({
    flex: index === 0 ? 2.2 : 1,
    textAlign: isNumeric(column.format) ? ('right' as const) : ('left' as const),
});

const PdfTable = ({ table, currency }: { table: ReportTable; currency: string }) => (
    <View style={styles.section}>
        {/* minPresenceAhead: titlul nu rămâne singur la capătul paginii */}
        <Text style={styles.sectionTitle} minPresenceAhead={60}>{table.title}</Text>
        {table.description && <Text style={styles.sectionDescription}>{table.description}</Text>}
        {table.rows.length === 0 ? (
            <Text style={styles.empty}>{table.emptyText}</Text>
        ) : (
            <View style={styles.table}>
                {/* fixed: antetul coloanelor se repetă pe fiecare pagină pe care continuă tabelul */}
                <View style={styles.tr} wrap={false} fixed>
                    {table.columns.map((column, index) => (
                        <Text key={column.key} style={[styles.th, cellStyle(column, index)]}>{column.label}</Text>
                    ))}
                </View>
                {table.rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={[styles.tr, row.subtotal ? styles.bold : {}]} wrap={false}>
                        {table.columns.map((column, index) => (
                            <Text key={column.key} style={[styles.td, cellStyle(column, index)]}>
                                {formatCell(row.cells[column.key] ?? null, column.format, currency)}
                            </Text>
                        ))}
                    </View>
                ))}
                {table.totals && (
                    <View style={[styles.tr, styles.bold]} wrap={false}>
                        {table.columns.map((column, index) => {
                            const value = table.totals?.[column.key];
                            return (
                                <Text key={column.key} style={[styles.td, cellStyle(column, index)]}>
                                    {value === undefined ? '' : formatCell(value, column.format, currency)}
                                </Text>
                            );
                        })}
                    </View>
                )}
            </View>
        )}
    </View>
);

interface ReportPdfProps {
    report: ReportBase;
    clinic: ClinicSettings | null;
    filterLabel: string | null; // ex. „Dr. Popescu Ion”
    generatedOn: string;
    logo?: { data: Buffer; format: LogoFormat } | null; // logo-ul clinicii, deja descărcat
}

export const ReportPdf = ({ report, clinic, filterLabel, generatedOn, logo }: ReportPdfProps) => {
    const currency = clinic?.currency ?? 'MDL';
    // Tabelele cu multe coloane încap mai bine pe orizontală
    const landscape = report.tables.some((table) => table.columns.length > 7);
    const subtitle = [report.period.label, filterLabel].filter(Boolean).join(' · ');

    return (
        <Document title={`${report.title} — ${subtitle}`} author={clinic?.clinicName ?? undefined} language='ro'>
            <Page size='A4' orientation={landscape ? 'landscape' : 'portrait'} style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.clinicBlock}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image din react-pdf, nu <img> HTML */}
                        {logo && <Image src={logo} style={styles.logo} />}
                        <View>
                            <Text style={styles.clinicName}>{clinic?.clinicName ?? 'Clinica'}</Text>
                            {clinic?.address && <Text style={styles.small}>{clinic.address}</Text>}
                        </View>
                    </View>
                    <Text style={styles.small}>Generat la {formatDate(generatedOn)}</Text>
                </View>

                <Text style={styles.title}>Raport: {report.title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                <View style={styles.kpis}>
                    {report.kpis.map((kpi) => (
                        <View key={kpi.label} style={styles.kpi} wrap={false}>
                            <Text style={styles.kpiLabel}>{kpi.label}</Text>
                            <Text style={styles.kpiValue}>{formatCell(kpi.value, kpi.format, currency)}</Text>
                            {kpi.hint && <Text style={styles.kpiHint}>{kpi.hint}</Text>}
                        </View>
                    ))}
                </View>

                {report.tables.map((table) => <PdfTable key={table.id} table={table} currency={currency} />)}

                <View style={styles.footer} fixed>
                    <Text>{report.title} · {subtitle}</Text>
                    <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} din ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
};

export const renderReportPdf = (props: ReportPdfProps) => renderToBuffer(<ReportPdf {...props} />);
