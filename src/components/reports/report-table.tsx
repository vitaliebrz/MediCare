import Link from 'next/link';
import { Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCell, isNumeric } from '@/lib/reports/format';
import type { ReportTable } from '@/lib/reports/types';

// Un tabel de raport, construit din descrierea comună (aceeași ca pentru CSV și PDF)
export const ReportTableCard = ({ table, currency, csvHref, children }: {
    table: ReportTable;
    currency: string;
    csvHref: string;
    children?: React.ReactNode; // conținut în loc de tabel (ex. cutiile cu vechimea datoriilor)
}) => (
    <section className='flex flex-col gap-3 rounded-lg border bg-white p-4'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
                <h2 className='font-semibold'>{table.title}</h2>
                {table.description && <p className='text-xs text-slate-500'>{table.description}</p>}
            </div>
            {table.rows.length > 0 && (
                <a href={csvHref} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')} title='Descarcă tabelul pentru Excel'>
                    <Download /> CSV
                </a>
            )}
        </div>

        {table.rows.length === 0 ? (
            <p className='rounded-md border border-dashed py-8 text-center text-sm text-slate-500'>{table.emptyText}</p>
        ) : children ?? (
            <div className='overflow-x-auto rounded-md border'>
                <Table>
                    <TableHeader>
                        <TableRow className='bg-zinc-100 hover:bg-zinc-100'>
                            {table.columns.map((column) => (
                                <TableHead key={column.key} className={cn(isNumeric(column.format) && 'text-right')}>{column.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {table.rows.map((row, index) => (
                            <TableRow key={index} className={cn(row.subtotal && 'bg-slate-50 font-semibold')}>
                                {table.columns.map((column, columnIndex) => {
                                    const text = formatCell(row.cells[column.key] ?? null, column.format, currency);
                                    return (
                                        <TableCell key={column.key} className={cn('whitespace-nowrap', isNumeric(column.format) && 'text-right tabular-nums')}>
                                            {columnIndex === 0 && row.href
                                                ? <Link href={row.href} className='font-medium hover:text-teal-600 hover:underline'>{text}</Link>
                                                : text}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                    {table.totals && (
                        <TableFooter>
                            <TableRow className='font-semibold'>
                                {table.columns.map((column) => {
                                    const value = table.totals?.[column.key];
                                    return (
                                        <TableCell key={column.key} className={cn('whitespace-nowrap', isNumeric(column.format) && 'text-right tabular-nums')}>
                                            {value === undefined ? '' : formatCell(value, column.format, currency)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>
        )}
    </section>
);
