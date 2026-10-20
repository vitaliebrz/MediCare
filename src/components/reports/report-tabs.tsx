import Link from 'next/link';
import { cn } from '@/lib/utils';
import { REPORT_KINDS } from '@/lib/reports/types';
import { REPORT_META, reportQuery, type ReportParams } from '@/lib/reports/params';

// Tab-urile sunt linkuri: schimbă doar raportul, păstrând perioada și medicul
export const ReportTabs = ({ params }: { params: ReportParams }) => (
    <nav aria-label='Rapoarte' className='flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg border bg-white p-1'>
        {REPORT_KINDS.map((kind) => (
            <Link
                key={kind}
                href={`/rapoarte${reportQuery({ ...params, kind })}`}
                aria-current={params.kind === kind ? 'page' : undefined}
                className={cn(
                    'whitespace-nowrap rounded-md px-3 py-1.5 text-sm',
                    params.kind === kind ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100',
                )}
            >
                {REPORT_META[kind].label}
            </Link>
        ))}
    </nav>
);
