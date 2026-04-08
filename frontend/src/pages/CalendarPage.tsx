import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchUpcomingEvals } from '../lib/dataService';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const TYPE_COLOR: Record<string, string> = {
    midsem: 'border-l-tertiary bg-tertiary/10 text-tertiary',
    endsem: 'border-l-tertiary bg-tertiary/10 text-tertiary',
    quiz: 'border-l-secondary bg-secondary/5 text-secondary',
    assignment: 'border-l-zinc-600 bg-zinc-900/50 text-zinc-300',
    lab: 'border-l-secondary bg-secondary/5 text-secondary',
    project: 'border-l-zinc-600 bg-zinc-900/50 text-zinc-300',
    viva: 'border-l-zinc-600 bg-zinc-900/50 text-zinc-300',
    other: 'border-l-zinc-800 bg-zinc-900/30 text-zinc-500',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [evals, setEvals] = useState<any[]>([]);
    const [selected, setSelected] = useState<number | null>(today.getDate());

    const load = useCallback(async () => {
        try { const evaluations = await fetchUpcomingEvals(); setEvals(evaluations); }
        catch { /* silent */ }
    }, []);

    useEffect(() => { load(); }, [load]);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const evalsOnDay = (day: number) => {
        const d = new Date(year, month, day);
        return evals.filter(e => {
            const ed = new Date(e.date);
            return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
        });
    };

    const selectedEvals = selected ? evalsOnDay(selected) : [];
    const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    return (
        <div className="flex min-h-screen bg-black">
            <Sidebar />
            <main className="grow flex flex-col overflow-hidden">
                {/* Calendar header */}
                <header className="border-b border-outline-variant bg-black px-8 py-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center space-x-8">
                        <h2 className="text-3xl font-extrabold text-white uppercase tracking-tighter font-headline">
                            {MONTHS[month]} {year}
                        </h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={prevMonth} className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:border-white transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelected(today.getDate()); }}
                            className="px-6 py-2 border border-outline-variant text-[10px] font-bold tracking-widest hover:border-white transition-colors uppercase"
                        >
                            Today
                        </button>
                        <button onClick={nextMonth} className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:border-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="flex grow overflow-hidden">
                    {/* Calendar grid */}
                    <div className="grow flex flex-col overflow-y-auto">
                        {/* Day labels */}
                        <div className="grid grid-cols-7 border-b border-outline-variant shrink-0">
                            {DAYS.map(d => (
                                <div key={d} className="border-r last:border-r-0 border-outline-variant p-4 bg-zinc-900/50 text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase">
                                    {d}
                                </div>
                            ))}
                        </div>
                        {/* Day cells */}
                        <div className="grid grid-cols-7 grow">
                            {/* Empty leading cells */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="border-r border-b border-outline-variant p-4 min-h-30 opacity-20" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayEvals = evalsOnDay(day);
                                const isSelected = selected === day;
                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelected(day)}
                                        className={`border-r border-b border-outline-variant p-3 min-h-30 cursor-pointer transition-colors hover:bg-zinc-900/50 ${isSelected ? 'bg-zinc-900' : ''
                                            } ${isToday(day) ? 'ring-1 ring-inset ring-secondary/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold ${isToday(day) ? 'text-secondary' : 'text-zinc-400'}`}>
                                                {String(day).padStart(2, '0')}
                                            </span>
                                            {isToday(day) && <span className="w-1.5 h-1.5 bg-secondary" />}
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvals.slice(0, 2).map(e => (
                                                <div key={e.id} className={`text-[9px] font-bold p-1 border-l-2 truncate uppercase ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other}`}>
                                                    {e.title}
                                                </div>
                                            ))}
                                            {dayEvals.length > 2 && (
                                                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">+{dayEvals.length - 2} more</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right panel */}
                    <aside className="w-96 border-l border-outline-variant bg-black flex flex-col shrink-0 overflow-y-auto">
                        <div className="p-6 border-b border-outline-variant">
                            <h3 className="text-[18px] font-extrabold tracking-[0.2em] uppercase text-zinc-500 mb-6">
                                {selected ? `Day ${String(selected).padStart(2, '0')} / ${MONTHS[month].slice(0, 3).toUpperCase()}` : 'Select a Day'}
                            </h3>

                            {selectedEvals.length === 0 ? (
                                <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">No evaluations</p>
                            ) : (
                                <div className="space-y-4">
                                    {selectedEvals.map(e => {
                                        const isCritical = ['midsem', 'endsem'].includes(e.type);
                                        return (
                                            <div key={e.id} className={`border p-4 space-y-2 ${isCritical ? 'border-tertiary bg-tertiary/5' : 'border-outline-variant bg-zinc-900/30'}`}>
                                                {isCritical && (
                                                    <div className="flex items-center space-x-2">
                                                        <AlertTriangle className="w-3 h-3 text-tertiary" />
                                                        <span className="text-[9px] font-bold text-tertiary uppercase tracking-widest">Critical</span>
                                                    </div>
                                                )}
                                                <p className="text-[10px] font-bold text-white uppercase tracking-widest">{e.title}</p>
                                                <p className="text-[9px] text-zinc-500 uppercase truncate">{e.courseName}</p>
                                                <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                                                    <span>{e.type.toUpperCase()}</span>
                                                    <span>{e.weightage}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Upcoming deadlines summary */}
                        <div className="p-6">
                            <h3 className="text-[18px] font-extrabold tracking-[0.2em] uppercase text-zinc-500 mb-4">Upcoming</h3>
                            {evals.slice(0, 5).map(e => {
                                const days = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000);
                                return (
                                    <div key={e.id} className="flex items-center justify-between py-3 border-b border-outline-variant last:border-b-0">
                                        <div>
                                            <p className="text-[10px] font-bold text-white uppercase truncate max-w-35">{e.title}</p>
                                            <p className="text-[9px] text-zinc-600 uppercase truncate max-w-35">{e.courseName}</p>
                                        </div>
                                        <span className={`text-[9px] font-black font-mono ${days <= 3 ? 'text-tertiary' : days <= 7 ? 'text-secondary' : 'text-zinc-600'}`}>
                                            {days === 0 ? 'TODAY' : `${days}D`}
                                        </span>
                                    </div>
                                );
                            })}
                            {evals.length === 0 && <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">No upcoming evaluations</p>}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
