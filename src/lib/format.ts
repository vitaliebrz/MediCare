// '2026-10-15' -> '15.10.2026'. Fără Date/toLocale..., ca serverul și browserul să afișeze identic
// (altfel fusul orar sau limba browserului pot produce erori de hydration).
export function formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return '—';
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
}

// 1250 -> '1 250.00 MDL'
export function formatMoney(amount: number | string | null | undefined, currency: string): string {
    const value = Number(amount ?? 0);
    const [whole, cents] = value.toFixed(2).split('.');
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${cents} ${currency}`;
}
