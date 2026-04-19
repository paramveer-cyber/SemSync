// import { useState, useEffect, useCallback, useMemo } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import Sidebar from '../components/Sidebar';
// import { getClassroomToken as apiGetClassroomToken } from '../lib/api';
// import { getCachedData, ClassroomCourse } from './ClassroomPage';
// import {
//   RefreshCw, Megaphone, Loader2, Trophy,
//   ChevronDown, ChevronUp, CheckCircle,
//   BookOpen, Search, ArrowUpRight, ArrowLeft, WifiOff,
//   AlertTriangle,
// } from 'lucide-react';

// const WORK_TYPE_LABEL: Record<string, string> = {
//   ASSIGNMENT: 'Assignment',
//   SHORT_ANSWER_QUESTION: 'Short answer',
//   MULTIPLE_CHOICE_QUESTION: 'MCQ',
// };

// function gradeColor(pct: number | null): string {
//   if (pct === null) return '#F59E0B';
//   if (pct >= 90) return '#10B981';
//   if (pct >= 80) return '#84CC16';
//   if (pct >= 70) return '#EAB308';
//   if (pct >= 60) return '#F97316';
//   return '#EF4444';
// }

// const ACCENT_PALETTE = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#F97316'];
// function courseAccent(name: string): string {
//   let h = 0;
//   for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % ACCENT_PALETTE.length;
//   return ACCENT_PALETTE[Math.abs(h)];
// }

// function fmtDate(iso: string) {
//   return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// }
// function fmtDateShort(iso: string) {
//   return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
// }
// function timeAgo(iso: string) {
//   const diff = Date.now() - new Date(iso).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }
// function daysUntil(dateStr: string) {
//   return Math.ceil((new Date(dateStr + 'T23:59:59').getTime() - Date.now()) / 86400000);
// }

// type AssignmentStatus = 'missing' | 'due-soon' | 'pending' | 'submitted' | 'graded';

// function getAssignmentStatus(cw: { dueDate: string | null }, isSubmitted: boolean, hasGrade: boolean): AssignmentStatus {
//   if (hasGrade) return 'graded';
//   if (isSubmitted) return 'submitted';
//   if (!cw.dueDate) return 'pending';
//   const days = daysUntil(cw.dueDate);
//   if (days < 0) return 'missing';
//   if (days === 0 || days === 1) return 'due-soon';
//   return 'pending';
// }

// const STATUS_COLOR: Record<AssignmentStatus, string> = {
//   missing: '#EF4444', 'due-soon': '#F59E0B', pending: '#3B82F6', submitted: '#10B981', graded: '#10B981',
// };

// function urgencyLabel(days: number): { text: string; color: string } {
//   if (days < 0)   return { text: 'OVERDUE',  color: '#EF4444' };
//   if (days === 0) return { text: 'TODAY',    color: '#EF4444' };
//   if (days === 1) return { text: 'TMR',      color: '#F59E0B' };
//   if (days <= 3)  return { text: `${days}d`, color: '#F59E0B' };
//   if (days <= 7)  return { text: `${days}d`, color: '#3B82F6' };
//   return { text: `${days}d`, color: 'var(--color-text-faint)' };
// }

// type CourseWork = ClassroomCourse['coursework'][number];
// type GradedSubmission = ClassroomCourse['gradedSubmissions'][number];

// function AssignmentRow({ cw, isSubmitted, grade, isDone, onToggleDone }: {
//   cw: CourseWork; isSubmitted: boolean; grade?: GradedSubmission; isDone?: boolean; onToggleDone?: () => void;
// }) {
//   const hasGrade = !!grade;
//   const effectiveSubmitted = isSubmitted || isDone;
//   const status = getAssignmentStatus(cw, effectiveSubmitted!, hasGrade);
//   const accentColor = STATUS_COLOR[status];
//   const days = cw.dueDate ? daysUntil(cw.dueDate) : null;
//   const urgency = days !== null && !effectiveSubmitted && !hasGrade ? urgencyLabel(days) : null;
//   const metaParts = [WORK_TYPE_LABEL[cw.workType] ?? cw.workType, cw.maxPoints != null ? `${cw.maxPoints} pts` : null].filter(Boolean).join(' · ');
//   const done = isDone && !isSubmitted && !hasGrade;

//   return (
//     <div style={{
//       display: 'flex', alignItems: 'center', gap: 14,
//       background: 'var(--color-surface-1)',
//       border: '1px solid var(--color-glass-border)',
//       borderLeft: `3px solid ${accentColor}`,
//       borderRadius: 8, padding: '14px 16px 14px 14px',
//       opacity: done ? 0.6 : 1,
//       transition: 'opacity 0.15s',
//     }}>
//       {onToggleDone && !isSubmitted && !hasGrade && (
//         <button
//           onClick={e => { e.stopPropagation(); onToggleDone(); }}
//           title={done ? 'Mark undone' : 'Mark done'}
//           style={{
//             flexShrink: 0, width: 24, height: 24, borderRadius: 6,
//             border: `1.5px solid ${done ? '#10B981' : 'var(--color-glass-border)'}`,
//             background: done ? '#10B98115' : 'transparent',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             cursor: 'pointer', transition: 'all 0.12s',
//           }}
//         >
//           <CheckCircle style={{ width: 13, height: 13, color: done ? '#10B981' : 'var(--color-text-faint)' }} />
//         </button>
//       )}

//       <div
//         onClick={() => cw.alternateLink && window.open(cw.alternateLink, '_blank')}
//         style={{ flex: 1, minWidth: 0, cursor: cw.alternateLink ? 'pointer' : 'default' }}
//       >
//         <p style={{
//           fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 3px',
//           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//           textDecoration: done ? 'line-through' : 'none',
//         }}>{cw.title}</p>
//         <p style={{ fontSize: 12, color: 'var(--color-text-faint)', margin: 0 }}>{metaParts}</p>
//       </div>

//       <div style={{ flexShrink: 0, textAlign: 'right' }}>
//         {hasGrade ? (
//           <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
//             ✓ returned
//           </span>
//         ) : isSubmitted ? (
//           <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Submitted</span>
//         ) : done ? (
//           <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Done</span>
//         ) : (
//           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
//             {cw.dueDate && <span style={{ fontSize: 12, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{fmtDateShort(cw.dueDate)}</span>}
//             {urgency && (
//               <span style={{
//                 fontSize: 11, fontWeight: 800, color: urgency.color, fontFamily: 'monospace',
//                 padding: '2px 6px', borderRadius: 4,
//                 background: urgency.color + '12',
//               }}>{urgency.text}</span>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function AnnouncementCard({ ann }: { ann: ClassroomCourse['announcements'][number] }) {
//   const [expanded, setExpanded] = useState(false);
//   const isLong = ann.text.length > 300;

//   return (
//     <div style={{
//       background: 'var(--color-surface-1)',
//       border: '1px solid var(--color-glass-border)',
//       borderRadius: 10,
//       overflow: 'hidden',
//     }}>
//       {/* Header */}
//       <div style={{
//         display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//         padding: '12px 18px',
//         borderBottom: '1px solid var(--color-glass-border)',
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
//           <Megaphone style={{ width: 12, height: 12, color: '#8B5CF6' }} />
//           <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
//             Announcement
//           </span>
//         </div>
//         <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>
//           {timeAgo(ann.updateTime)}
//         </span>
//       </div>

//       {/* Body */}
//       <div style={{ padding: '16px 18px' }}>
//         <p style={{
//           fontSize: 14, color: 'var(--color-text)', lineHeight: 1.75,
//           whiteSpace: 'pre-wrap', margin: 0,
//         }}>
//           {isLong && !expanded ? ann.text.slice(0, 300) + '…' : ann.text}
//         </p>
//         {isLong && (
//           <button
//             onClick={() => setExpanded(v => !v)}
//             style={{
//               marginTop: 12, fontSize: 12, color: 'var(--color-brand)',
//               background: 'none', border: 'none', cursor: 'pointer',
//               padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
//             }}
//           >
//             {expanded
//               ? <><ChevronUp style={{ width: 12, height: 12 }} />Show less</>
//               : <><ChevronDown style={{ width: 12, height: 12 }} />Read more</>
//             }
//           </button>
//         )}
//         <p style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 12, marginBottom: 0 }}>
//           {fmtDate(ann.creationTime)}
//         </p>
//       </div>
//     </div>
//   );
// }

// function GradeRow({ sub, coursework }: { sub: GradedSubmission; coursework: CourseWork[] }) {
//   const cw = coursework.find(c => c.id === sub.courseWorkId);
//   const pct = cw?.maxPoints ? Math.round((sub.assignedGrade / cw.maxPoints) * 100) : null;
//   const gc = gradeColor(pct);
//   return (
//     <div style={{
//       display: 'flex', alignItems: 'center', gap: 14,
//       background: 'var(--color-surface-1)',
//       border: '1px solid var(--color-glass-border)',
//       borderLeft: `3px solid ${gc}`,
//       borderRadius: 8, padding: '14px 16px',
//     }}>
//       <div style={{
//         width: 44, height: 44, borderRadius: 10, flexShrink: 0,
//         background: gc + '15', border: `1px solid ${gc}30`,
//         display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
//       }}>
//         {pct !== null
//           ? <span style={{ fontSize: 12, fontWeight: 900, color: gc, lineHeight: 1, fontFamily: 'monospace' }}>{pct}%</span>
//           : <Trophy style={{ width: 14, height: 14, color: gc }} />
//         }
//       </div>
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//           {cw?.title ?? 'Assignment'}
//         </p>
//         <p style={{ fontSize: 12, color: 'var(--color-text-faint)', margin: 0 }}>
//           Returned {timeAgo(sub.updateTime)}
//           {cw?.workType && <span style={{ marginLeft: 6 }}>· {WORK_TYPE_LABEL[cw.workType] ?? cw.workType}</span>}
//         </p>
//       </div>
//       <div style={{ textAlign: 'right', flexShrink: 0 }}>
//         <div style={{ fontSize: 20, fontWeight: 800, color: gc, lineHeight: 1, fontFamily: 'monospace' }}>
//           {sub.assignedGrade}
//           {cw?.maxPoints && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-faint)' }}>/{cw.maxPoints}</span>}
//         </div>
//         {pct !== null && (
//           <div style={{ marginTop: 6, width: 52, height: 3, borderRadius: 3, background: 'var(--color-glass-border)', marginLeft: 'auto' }}>
//             <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: gc }} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 }}>
//       <Icon style={{ width: 28, height: 28, color: 'var(--color-text-faint)' }} />
//       <p style={{ fontSize: 13, color: 'var(--color-text-faint)', textAlign: 'center' }}>{message}</p>
//     </div>
//   );
// }

// async function fetchTokenFromDB(): Promise<string | null> {
//   try { const res = await apiGetClassroomToken(); return res.token ?? null; } catch { return null; }
// }

// async function gFetch(path: string, token: string) {
//   const res = await fetch(`https://classroom.googleapis.com${path}`, { headers: { Authorization: `Bearer ${token}` } });
//   if (res.status === 401) throw new Error('TOKEN_EXPIRED');
//   if (!res.ok) throw new Error(`API error ${res.status}`);
//   return res.json();
// }

// async function fetchOneCourse(courseId: string, token: string): Promise<ClassroomCourse> {
//   const [courseRes, annRes, cwRes, subRes, tiRes] = await Promise.allSettled([
//     gFetch(`/v1/courses/${courseId}`, token),
//     gFetch(`/v1/courses/${courseId}/announcements?pageSize=20&orderBy=updateTime%20desc`, token),
//     gFetch(`/v1/courses/${courseId}/courseWork?pageSize=100&orderBy=dueDate%20desc`, token),
//     gFetch(`/v1/courses/${courseId}/courseWork/-/studentSubmissions?states=RETURNED`, token),
//     gFetch(`/v1/courses/${courseId}/courseWork/-/studentSubmissions?states=TURNED_IN`, token),
//   ]);
//   const raw = courseRes.status === 'fulfilled' ? courseRes.value : { id: courseId, name: 'Course' };
//   const announcements = annRes.status === 'fulfilled' ? (annRes.value.announcements ?? []).map((a: any) => ({ id: a.id, text: a.text, creationTime: a.creationTime, updateTime: a.updateTime })) : [];
//   const coursework = cwRes.status === 'fulfilled' ? (cwRes.value.courseWork ?? []).map((cw: any) => ({ id: cw.id, title: cw.title, description: cw.description, dueDate: cw.dueDate ? `${cw.dueDate.year}-${String(cw.dueDate.month).padStart(2,'0')}-${String(cw.dueDate.day).padStart(2,'0')}` : null, maxPoints: cw.maxPoints, workType: cw.workType, state: cw.state, alternateLink: cw.alternateLink })) : [];
//   const gradedSubmissions = subRes.status === 'fulfilled' ? (subRes.value.studentSubmissions ?? []).filter((s: any) => s.assignedGrade != null).map((s: any) => ({ courseWorkId: s.courseWorkId, assignedGrade: s.assignedGrade, updateTime: s.updateTime })) : [];
//   const tiIds: string[] = tiRes.status === 'fulfilled' ? (tiRes.value.studentSubmissions ?? []).map((s: any) => s.courseWorkId) : [];
//   const gradedIds = gradedSubmissions.map((s: any) => s.courseWorkId);
//   const turnedInIds = Array.from(new Set([...tiIds, ...gradedIds]));
//   return { id: raw.id, name: raw.name, section: raw.section, descriptionHeading: raw.descriptionHeading, alternateLink: raw.alternateLink, announcements, coursework, gradedSubmissions, turnedInIds };
// }

// export default function ClassroomCoursePage() {
//   const { courseId } = useParams<{ courseId: string }>();
//   const navigate = useNavigate();

//   const [course, setCourse] = useState<ClassroomCourse | null>(() => getCachedData()?.find(c => c.id === courseId) ?? null);
//   const [loading, setLoading] = useState(!course);
//   const [error, setError] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<'announcements' | 'work' | 'grades'>('announcements');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filterType, setFilterType] = useState<'all' | 'pending' | 'submitted'>('all');
//   const [showPast, setShowPast] = useState(false);
//   const [localDoneIds, setLocalDoneIds] = useState<Set<string>>(() => {
//     try { return new Set(JSON.parse(localStorage.getItem('semsync_classroom_done_ids') ?? '[]')); } catch { return new Set(); }
//   });

//   const toggleDone = (cwId: string) => {
//     setLocalDoneIds(prev => {
//       const next = new Set(prev);
//       next.has(cwId) ? next.delete(cwId) : next.add(cwId);
//       localStorage.setItem('semsync_classroom_done_ids', JSON.stringify([...next]));
//       return next;
//     });
//   };

//   const load = useCallback(async (silent = false) => {
//     if (!courseId) return;
//     const token = await fetchTokenFromDB();
//     if (!token) { navigate('/classroom'); return; }
//     if (!silent) setLoading(true);
//     setError(null);
//     try {
//       const data = await fetchOneCourse(courseId, token);
//       setCourse(data);
//     } catch (e: any) {
//       if (e.message === 'TOKEN_EXPIRED') navigate('/classroom');
//       else setError(e.message ?? 'Failed to load course');
//     } finally { if (!silent) setLoading(false); }
//   }, [courseId, navigate]);

//   useEffect(() => {
//     if (!course) load();
//     else load(true);
//   }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

//   const accent = course ? courseAccent(course.name) : '#3B82F6';
//   const initials = course ? course.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : '??';

//   const allWork = course
//     ? [...course.coursework].filter(cw => cw.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
//     : [];

//   const filteredWork = useMemo(() => {
//     if (!course) return [];
//     return allWork.filter(cw => {
//       const isSubmitted = course.turnedInIds.includes(cw.id);
//       const hasGrade = course.gradedSubmissions.some(s => s.courseWorkId === cw.id);
//       if (filterType === 'pending'   && (isSubmitted || hasGrade)) return false;
//       if (filterType === 'submitted' && !isSubmitted && !hasGrade) return false;
//       if (searchQuery) return cw.title.toLowerCase().includes(searchQuery.toLowerCase());
//       return true;
//     });
//   }, [allWork, filterType, searchQuery, course]);

//   const upcomingWork = filteredWork.filter(cw => daysUntil(cw.dueDate!) >= 0);
//   const pastWork     = filteredWork.filter(cw => daysUntil(cw.dueDate!) < 0);

//   const urgentCount = course
//     ? course.coursework.filter(cw => cw.dueDate && daysUntil(cw.dueDate) >= 0 && daysUntil(cw.dueDate) <= 2 && !course.turnedInIds.includes(cw.id)).length
//     : 0;

//   return (
//     <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
//       <Sidebar />
//       <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

//         {/* Topbar */}
//         <div style={{
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           padding: '14px 28px', borderBottom: '1px solid var(--color-glass-border)',
//           flexShrink: 0, background: 'var(--color-bg)', gap: 12,
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
//             <button
//               onClick={() => navigate('/classroom')}
//               style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 7, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
//             >
//               <ArrowLeft style={{ width: 12, height: 12 }} />Back
//             </button>

//             {/* Course identity */}
//             <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
//               <div style={{
//                 width: 36, height: 36, borderRadius: 8, flexShrink: 0,
//                 background: accent + '18', border: `1.5px solid ${accent}35`,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 <span style={{ fontSize: 12, fontWeight: 800, color: accent }}>{initials}</span>
//               </div>
//               <div style={{ minWidth: 0 }}>
//                 <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                   {course?.name ?? 'Loading…'}
//                 </h1>
//                 {course?.section && (
//                   <p style={{ fontSize: 11, color: 'var(--color-text-faint)', margin: 0 }}>{course.section}</p>
//                 )}
//               </div>
//             </div>

//             {urgentCount > 0 && (
//               <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, background: '#EF444412', border: '1px solid #EF444435', flexShrink: 0 }}>
//                 <AlertTriangle style={{ width: 10, height: 10, color: '#EF4444' }} />
//                 <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{urgentCount} urgent</span>
//               </div>
//             )}
//           </div>

//           <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
//             {course?.alternateLink && (
//               <a
//                 href={course.alternateLink} target="_blank" rel="noreferrer"
//                 style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
//               >
//                 <ArrowUpRight style={{ width: 12, height: 12 }} />Classroom
//               </a>
//             )}
//             <button
//               onClick={() => load()} disabled={loading}
//               style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
//             >
//               <RefreshCw style={{ width: 12, height: 12 }} />Refresh
//             </button>
//           </div>
//         </div>

//         {/* Loading */}
//         {loading && !course && (
//           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
//             <Loader2 style={{ width: 24, height: 24, color: 'var(--color-brand)' }} className="animate-spin" />
//             <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading course…</p>
//           </div>
//         )}

//         {/* Error */}
//         {error && !course && (
//           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
//             <WifiOff style={{ width: 22, height: 22, color: '#EF4444' }} />
//             <p style={{ fontSize: 14, color: '#EF4444', fontWeight: 600 }}>{error}</p>
//             <button onClick={() => load()} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--color-brand)', color: '#fff', fontSize: 13, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Try again</button>
//           </div>
//         )}

//         {course && (
//           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

//             {/* Quick stats strip */}
//             <div style={{
//               display: 'flex', gap: 0,
//               borderBottom: '1px solid var(--color-glass-border)',
//               flexShrink: 0,
//             }}>
//               {[
//                 { label: 'Due this week', value: course.coursework.filter(cw => cw.dueDate && daysUntil(cw.dueDate) >= 0 && daysUntil(cw.dueDate) <= 7 && !course.turnedInIds.includes(cw.id)).length, color: accent },
//                 { label: 'Pending', value: course.coursework.filter(cw => cw.dueDate && daysUntil(cw.dueDate) >= 0 && !course.turnedInIds.includes(cw.id)).length, color: 'var(--color-text)' },
//                 { label: 'Announcements', value: course.announcements.length, color: '#8B5CF6' },
//                 { label: 'Total work', value: course.coursework.filter(cw => cw.dueDate).length, color: 'var(--color-text-faint)' },
//               ].map(({ label, value, color }, i, arr) => (
//                 <div key={label} style={{
//                   flex: 1, padding: '16px 24px',
//                   borderRight: i < arr.length - 1 ? '1px solid var(--color-glass-border)' : 'none',
//                   display: 'flex', flexDirection: 'column', gap: 3,
//                 }}>
//                   <span style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, fontFamily: 'monospace' }}>{value}</span>
//                   <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
//                 </div>
//               ))}
//             </div>

//             {/* Tabs */}
//             <div style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//               padding: '0 28px', borderBottom: '1px solid var(--color-glass-border)',
//               flexShrink: 0, gap: 8,
//             }}>
//               <div style={{ display: 'flex' }}>
//                 {([
//                   { key: 'announcements', label: 'Announcements', icon: Megaphone, count: course.announcements.length },
//                   { key: 'work',          label: 'Coursework',    icon: BookOpen,  count: course.coursework.filter(cw => cw.dueDate).length },
//                   { key: 'grades',        label: 'Grades',        icon: Trophy,    count: course.gradedSubmissions.length },
//                 ] as const).map(tab => (
//                   <button
//                     key={tab.key}
//                     onClick={() => setActiveTab(tab.key)}
//                     style={{
//                       display: 'flex', alignItems: 'center', gap: 6,
//                       padding: '13px 14px', border: 'none', cursor: 'pointer',
//                       fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
//                       background: 'transparent',
//                       color: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-text-muted)',
//                       borderBottom: activeTab === tab.key ? `2px solid var(--color-brand)` : '2px solid transparent',
//                       marginBottom: -1, transition: 'all 0.12s', whiteSpace: 'nowrap',
//                     }}
//                   >
//                     <tab.icon style={{ width: 13, height: 13 }} />
//                     {tab.label}
//                     {tab.count > 0 && (
//                       <span style={{
//                         padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800,
//                         background: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-glass-border)',
//                         color: activeTab === tab.key ? '#fff' : 'var(--color-text-muted)',
//                       }}>{tab.count}</span>
//                     )}
//                   </button>
//                 ))}
//               </div>

//               {activeTab === 'work' && (
//                 <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: 8, padding: '5px 11px' }}>
//                     <Search style={{ width: 11, height: 11, color: 'var(--color-text-faint)', flexShrink: 0 }} />
//                     <input
//                       value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
//                       placeholder="Search…"
//                       style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-text)', width: 100 }}
//                     />
//                   </div>
//                   {(['all', 'pending', 'submitted'] as const).map(f => (
//                     <button
//                       key={f} onClick={() => setFilterType(f)}
//                       style={{
//                         padding: '4px 11px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
//                         textTransform: 'capitalize', transition: 'all 0.12s',
//                         border: filterType === f ? `1.5px solid ${accent}` : '1px solid var(--color-glass-border)',
//                         background: filterType === f ? accent + '15' : 'transparent',
//                         color: filterType === f ? accent : 'var(--color-text-faint)',
//                       }}
//                     >{f}</button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Content */}
//             <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>

//               {/* Announcements tab */}
//               {activeTab === 'announcements' && (
//                 course.announcements.length === 0
//                   ? <EmptyState icon={Megaphone} message="No announcements yet." />
//                   : [...course.announcements]
//                       .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())
//                       .map(ann => <AnnouncementCard key={ann.id} ann={ann} />)
//               )}

//               {activeTab === 'grades' && (
//                 course.gradedSubmissions.length === 0
//                   ? <EmptyState icon={Trophy} message="No graded submissions yet." />
//                   : [...course.gradedSubmissions]
//                       .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())
//                       .map(sub => <GradeRow key={sub.courseWorkId} sub={sub} coursework={course.coursework} />)
//               )}

//               {/* Work tab */}
//               {activeTab === 'work' && (
//                 <>
//                   {upcomingWork.length === 0 && pastWork.length === 0 && (
//                     <EmptyState icon={CheckCircle} message={searchQuery || filterType !== 'all' ? 'No assignments match.' : 'No coursework with due dates.'} />
//                   )}

//                   {upcomingWork.length > 0 && (
//                     <>
//                       <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)', margin: '0 0 4px' }}>
//                         Upcoming · {upcomingWork.length}
//                       </p>
//                       {upcomingWork.map(cw => (
//                         <AssignmentRow
//                           key={cw.id} cw={cw}
//                           isSubmitted={course.turnedInIds.includes(cw.id)}
//                           grade={course.gradedSubmissions.find(s => s.courseWorkId === cw.id)}
//                           isDone={localDoneIds.has(cw.id)}
//                           onToggleDone={() => toggleDone(cw.id)}
//                         />
//                       ))}
//                     </>
//                   )}

//                   {pastWork.length > 0 && (
//                     <>
//                       <button
//                         onClick={() => setShowPast(v => !v)}
//                         style={{
//                           display: 'flex', alignItems: 'center', gap: 6,
//                           marginTop: 8, padding: '9px 14px',
//                           background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)',
//                           borderRadius: 8, fontSize: 13, fontWeight: 600,
//                           color: 'var(--color-text-muted)', cursor: 'pointer',
//                         }}
//                       >
//                         {showPast ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
//                         Past · {pastWork.length} item{pastWork.length !== 1 ? 's' : ''}
//                       </button>
//                       {showPast && pastWork.map(cw => (
//                         <AssignmentRow
//                           key={cw.id} cw={cw}
//                           isSubmitted={course.turnedInIds.includes(cw.id)}
//                           grade={course.gradedSubmissions.find(s => s.courseWorkId === cw.id)}
//                           isDone={localDoneIds.has(cw.id)}
//                           onToggleDone={() => toggleDone(cw.id)}
//                         />
//                       ))}
//                     </>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }