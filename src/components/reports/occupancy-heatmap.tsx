import { WEEKDAYS_SHORT } from '@/lib/calendar';

// Scară secvențială: o singură nuanță (teal), de la deschis (puține) la închis (multe).
// Celula goală e aproape albă, ca să se distingă de „1 programare”.
const RAMP = ['#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59'];
const EMPTY = '#f8fafc';
// De la acest pas textul devine alb (contrast suficient pe fundal închis)
const WHITE_TEXT_FROM = 5;

// Harta de ocupare: rânduri = ore, coloane = zilele săptămânii. Numărul e scris în celulă,
// deci intensitatea nu e singura informație (se poate citi și fără a distinge nuanțele).
export const OccupancyHeatmap = ({ hours, grid }: { hours: number[]; grid: number[][] }) => {
    const max = Math.max(...grid.flat(), 1);
    const step = (count: number) => Math.min(RAMP.length - 1, Math.floor(((count - 1) / max) * RAMP.length));

    return (
        <div className='flex flex-col gap-3'>
            <div className='overflow-x-auto'>
                <table className='w-full min-w-[28rem] border-separate border-spacing-0.5 text-xs'>
                    <thead>
                        <tr>
                            <th className='w-14' />
                            {WEEKDAYS_SHORT.map((day) => <th key={day} className='pb-1 font-medium text-slate-500'>{day}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {hours.map((hour, rowIndex) => (
                            <tr key={hour}>
                                <th className='pr-2 text-right font-normal tabular-nums text-slate-500'>{String(hour).padStart(2, '0')}:00</th>
                                {grid[rowIndex].map((count, day) => {
                                    const index = count > 0 ? step(count) : -1;
                                    return (
                                        <td
                                            key={day}
                                            title={`${WEEKDAYS_SHORT[day]}, ${String(hour).padStart(2, '0')}:00 — ${count} ${count === 1 ? 'programare' : 'programări'}`}
                                            className='h-7 rounded-sm text-center tabular-nums'
                                            style={{
                                                backgroundColor: index >= 0 ? RAMP[index] : EMPTY,
                                                color: index >= WHITE_TEXT_FROM ? '#fff' : '#334155',
                                            }}
                                        >
                                            {count > 0 ? count : ''}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Legenda scării */}
            <div className='flex items-center gap-2 text-xs text-slate-500'>
                <span>Puține</span>
                <div className='flex'>
                    {RAMP.map((color) => <span key={color} className='h-3 w-5' style={{ backgroundColor: color }} />)}
                </div>
                <span>Multe (max. {max})</span>
            </div>
        </div>
    );
};
