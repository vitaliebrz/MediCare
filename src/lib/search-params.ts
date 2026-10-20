// Next.js trimite un parametru repetat în URL (?q=a&q=b) ca listă: ['a', 'b'].
// Paginile lucrează cu un singur text, deci luăm prima valoare.
export const firstParam = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;
