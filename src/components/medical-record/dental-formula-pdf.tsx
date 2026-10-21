import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { DENTAL_CHART, type Dentition } from '@/lib/teeth';
import type { ToothStatusValue } from '@/lib/db/schema';

// Notațiile din formula dentară, după cele 5 stări pe care le stocăm. Gol = sănătos.
// Notațiile oficiale detaliate (C, P, Pt, Pl, K, R, I...) cer stări noi ale dinților (etapă ulterioară).
export const TOOTH_CODE: Record<ToothStatusValue, string> = {
    sanatos: '',
    tratat: 'T',
    necesita_tratament: 'N',
    extras: 'A',
    cazut_natural: 'A',
};

const styles = StyleSheet.create({
    jaw: { flexDirection: 'row', justifyContent: 'center' },
    half: { flexDirection: 'row' },
    halfLeft: { borderRightWidth: 1.5, borderRightColor: '#111' },
    cell: { width: 26, height: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#999', marginLeft: -0.5 },
    number: { fontSize: 7.5, color: '#555' },
    code: { fontSize: 9, fontWeight: 'bold' },
    middle: { alignSelf: 'center', borderBottomWidth: 1.5, borderBottomColor: '#111' },
    legend: { marginTop: 6, fontSize: 8, color: '#444', textAlign: 'center' },
    title: { fontSize: 8, color: '#555', marginBottom: 2, textAlign: 'center' },
});

// Un rând al formulei: jumătatea dreaptă a pacientului (stânga pe hârtie) | jumătatea stângă
const Row = ({ halves, codeFor, showCodes }: { halves: number[][]; codeFor: (tooth: number) => string; showCodes: 'above' | 'below' }) => (
    <View style={styles.jaw}>
        {halves.map((teeth, index) => (
            <View key={index} style={[styles.half, index === 0 ? styles.halfLeft : {}]}>
                {teeth.map((tooth) => (
                    <View key={tooth}>
                        {showCodes === 'above' && <View style={styles.cell}><Text style={styles.code}>{codeFor(tooth)}</Text></View>}
                        <View style={styles.cell}><Text style={styles.number}>{tooth}</Text></View>
                        {showCodes === 'below' && <View style={styles.cell}><Text style={styles.code}>{codeFor(tooth)}</Text></View>}
                    </View>
                ))}
            </View>
        ))}
    </View>
);

// Formula dentară: sus maxilarul (notațiile deasupra numerelor), jos mandibula (notațiile dedesubt)
export const DentalFormulaPdf = ({ dentitions, statuses }: {
    dentitions: Dentition[];
    statuses: Map<number, ToothStatusValue>;
}) => {
    const codeFor = (tooth: number) => TOOTH_CODE[statuses.get(tooth) ?? 'sanatos'];
    return (
        <View wrap={false}>
            {dentitions.map((dentition) => (
                <View key={dentition} style={{ marginBottom: 6 }}>
                    {dentitions.length > 1 && <Text style={styles.title}>{dentition === 'adult' ? 'Dinți permanenți' : 'Dinți temporari (de lapte)'}</Text>}
                    <Row halves={DENTAL_CHART[dentition].upper} codeFor={codeFor} showCodes='above' />
                    <View style={[styles.middle, { width: DENTAL_CHART[dentition].upper.flat().length * 26 }]} />
                    <Row halves={DENTAL_CHART[dentition].lower} codeFor={codeFor} showCodes='below' />
                </View>
            ))}
            <Text style={styles.legend}>Notații: T — tratat · N — necesită tratament · A — absent (extras / căzut) · gol — sănătos</Text>
        </View>
    );
};
