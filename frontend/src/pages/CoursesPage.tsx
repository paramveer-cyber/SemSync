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
  const [error, setError] = useState('');
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
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <main className="grow flex flex-col">
        <Header title="Academic Tracks" subtitle="Directory_V2.0" />
        <div className="p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="font-bold text-xs tracking-[0.3em] uppercase block mb-2" style={{ color: 'var(--color-brand)' }}>// DIRECTORY_V2.0</span>
              <h2 className="text-7xl font-extrabold tracking-tighter uppercase leading-none" style={{ color: 'var(--color-text)' }}>Academic Tracks</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-4 flex items-center space-x-4 rounded-lg" style={{ border: '1px solid var(--color-glass-border)' }}>
                <div className="w-2 h-2 animate-pulse rounded-full" style={{ background: 'var(--color-brand)' }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-faint)' }}>{courses.length} ACTIVE NODES</span>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-6 py-4 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 rounded-lg"
                style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-brand)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-surface)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px var(--color-brand-glow)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-active-bg)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}>
                <Plus className="w-4 h-4" />
                New Node
              </button>
            </div>
          </div>

          {error && (
            <div className="px-6 py-4 flex items-center space-x-3 mb-8 rounded-lg"
              style={{ border: '1px solid var(--color-danger)', background: 'rgba(239,68,68,0.05)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-danger)' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-danger)' }}>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center space-x-4 py-20">
              <div className="w-px h-8 animate-pulse" style={{ background: 'var(--color-brand)' }} />
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: 'var(--color-text-faint)' }}>Scanning nodes…</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="border border-dashed p-20 text-center rounded-lg" style={{ borderColor: 'var(--color-glass-border)' }}>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--color-text-faint)' }}>No course nodes initialized</p>
              <button
                onClick={() => setShowAdd(true)}
                className="px-10 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 rounded-lg"
                style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-brand)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-surface)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-active-bg)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand)';
                }}>
                Initialize First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => (
                <div
                  key={course.id}
                  className="p-8 group transition-all rounded-lg"
                  style={{ border: '1px solid var(--color-glass-border)', background: 'var(--color-surface-1)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-1)'}>

                  <div className="flex justify-between items-start mb-14">
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: 'var(--color-text-faint)' }}>
                      NODE_{String(i + 1).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => handleDelete(course.id, course.name)}
                      title={`Delete ${course.name}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150 opacity-0 group-hover:opacity-100"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.22)' }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#ef4444';
                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.22)';
                      }}>
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>

                  <Link to={`/courses/${course.id}`}>
                    <h3 className="text-2xl font-bold tracking-tighter mb-1 group-hover:text-[var(--color-brand)] transition-colors uppercase" style={{ color: 'var(--color-text)' }}>
                      {course.name}
                    </h3>
                    <div className="flex items-center space-x-4 mb-10 text-[10px] font-mono" style={{ color: 'var(--color-text-faint)' }}>
                      {course.credits && <span>{course.credits} CREDITS</span>}
                      <span>TARGET: {course.targetGrade}%</span>
                    </div>
                    <div className="pt-4" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                      <span className="text-[10px] font-bold tracking-widest uppercase group-hover:text-[var(--color-text)] transition-colors" style={{ color: 'var(--color-brand)' }}>
                        → Access Track
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-auto px-8 py-8 flex justify-between items-center" style={{ borderTop: '1px solid var(--color-glass-border)', background: 'var(--color-surface)' }}>
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-faint)' }}>© 2026 SEMSYNC</span>
        </footer>
      </main>

      {showAdd && <AddCourseModal onClose={() => setShowAdd(false)} onCreated={c => { invalidateAllCourseData(); setCourses(p => [...p, c]); }} />}
    </div>
  );
}