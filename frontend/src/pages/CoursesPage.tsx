import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddCourseModal from '../components/modals/AddCourseModal';
import { deleteCourse } from '../lib/api';
import { fetchCourses, invalidateAllCourseData } from '../lib/dataService';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const c = await fetchCourses(); setCourses(c); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await deleteCourse(id); invalidateAllCourseData(); setCourses(p => p.filter(c => c.id !== id)); }
    catch (err: any) { alert('Failed: ' + err.message); }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="grow flex flex-col">
        <Header title="Academic Tracks" subtitle="Directory_V2.0" />
        <div className="p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-secondary font-bold text-xs tracking-[0.3em] uppercase block mb-2">// DIRECTORY_V2.0</span>
              <h2 className="text-7xl font-extrabold tracking-tighter uppercase leading-none">Academic Tracks</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="border border-outline-variant p-4 flex items-center space-x-4">
                <div className="w-2 h-2 bg-secondary animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{courses.length} ACTIVE NODES</span>
              </div>
              {/* New Node — Anticipation → green */}
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-6 py-4 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                style={{ border: '1px solid #22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#22c55e';
                  (e.currentTarget as HTMLButtonElement).style.color = '#000';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(34,197,94,0.35)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#22c55e';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}>
                <Plus className="w-4 h-4" />
                New Node
              </button>
            </div>
          </div>

          {error && (
            <div className="border border-tertiary bg-tertiary/5 px-6 py-4 flex items-center space-x-3 mb-8">
              <AlertTriangle className="w-4 h-4 text-tertiary shrink-0" />
              <span className="text-[11px] font-bold text-tertiary uppercase tracking-widest">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center space-x-4 py-20">
              <div className="w-px h-8 bg-secondary animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Scanning nodes…</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="border border-dashed border-outline-variant p-20 text-center">
              <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase mb-6">No course nodes initialized</p>
              <button
                onClick={() => setShowAdd(true)}
                className="px-10 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                style={{ border: '1px solid #22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#22c55e';
                  (e.currentTarget as HTMLButtonElement).style.color = '#000';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#22c55e';
                }}>
                Initialize First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-outline-variant">
              {courses.map((course, i) => (
                <div key={course.id} className="border-r border-b border-outline-variant p-8 group hover:bg-zinc-900 transition-all">
                  <div className="flex justify-between items-start mb-14">
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-zinc-600">
                      NODE_{String(i + 1).padStart(2, '0')}
                    </span>
                    {/* Delete — Anger → red, explicit icon + label */}
                    <button
                      onClick={() => handleDelete(course.id, course.name)}
                      title={`Delete ${course.name}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150 opacity-0 group-hover:opacity-100"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.22)' }}
                      onMouseEnter={el => {
                        (el.currentTarget as HTMLButtonElement).style.background = '#ef4444';
                        (el.currentTarget as HTMLButtonElement).style.color = '#fff';
                        (el.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                      }}
                      onMouseLeave={el => {
                        (el.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)';
                        (el.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                        (el.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.22)';
                      }}>
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                  <Link to={`/courses/${course.id}`}>
                    <h3 className="text-2xl font-bold tracking-tighter mb-1 group-hover:text-secondary transition-colors uppercase">{course.name}</h3>
                    <div className="flex items-center space-x-4 mb-10 text-[10px] text-zinc-500 font-mono">
                      {course.credits && <span>{course.credits} CREDITS</span>}
                      <span>TARGET: {course.targetGrade}%</span>
                    </div>
                    <div className="border-t border-outline-variant pt-4">
                      <span className="text-[10px] font-bold text-secondary tracking-widest uppercase group-hover:text-white transition-colors">
                        → Access Track
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-auto border-t border-outline-variant px-8 py-8 flex justify-between items-center bg-black">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">© 2026 SEMSYNC</span>
        </footer>
      </main>

      {showAdd && <AddCourseModal onClose={() => setShowAdd(false)} onCreated={c => { invalidateAllCourseData(); setCourses(p => [...p, c]); }} />}
    </div>
  );
}
