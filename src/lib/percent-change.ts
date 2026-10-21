// Procentul de schimbare față de perioada anterioară, pentru cardurile din dashboard.

export type Change =
    | { kind: 'none' }                    // fără comparație (De la început, sau 0 -> 0)
    | { kind: 'new' }                     // înainte 0, acum > 0: nu se poate împărți la zero
    | { kind: 'percent'; value: number }; // ex. 18 sau -5

export type ChangeTone = 'good' | 'bad' | 'neutral';

export function percentChange(current: number, previous: number | null): Change {
    if (previous === null) return { kind: 'none' };
    if (previous === 0) return current === 0 ? { kind: 'none' } : { kind: 'new' };
    return { kind: 'percent', value: Math.round(((current - previous) / previous) * 100) };
}

// Culoarea urmează SENSUL schimbării: la Datorii (higherIsBetter = false) o scădere e bună
export function changeTone(change: Change, higherIsBetter: boolean): ChangeTone {
    if (change.kind === 'none') return 'neutral';
    const increased = change.kind === 'new' || change.value > 0;
    if (change.kind === 'percent' && change.value === 0) return 'neutral';
    return increased === higherIsBetter ? 'good' : 'bad';
}
