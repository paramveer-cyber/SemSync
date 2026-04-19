import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Sidebar from '../components/Sidebar';
import SyncCourseModal from '../components/modals/SyncCourseModal';
import {
  getClassroomToken as apiGetClassroomToken,
  saveClassroomToken as apiSaveClassroomToken,
  clearClassroomToken as apiClearClassroomToken,
} from '../lib/api';
import { invalidateAllCourseData } from '../lib/dataService';
import {
  GraduationCap, RefreshCw, Megaphone,
  Trophy, Loader2, WifiOff, Link2, Link2Off,
  ChevronDown, ChevronUp, Star, CheckCircle2,
  BookOpen, AlertCircle, Search, ArrowUpRight,
} from 'lucide-react';

const LS_DATA_KEY     = 'semsync_classroom_data';
const CALENDAR_LS_KEY = 'semsync_calendar_items';
const AUTO_REFRESH_MS = 5 * 60 * 1000; 

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/classroom.course-work.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
].join(' ');


interface Announcement { id: string; text: string; creationTime: string; updateTime: string; }
interface CourseWork {
  id: string; title: string; description?: string;
  dueDate: string | null; maxPoints?: number;
  workType: string; state: string; alternateLink?: string;
}
interface GradedSubmission {
  courseWorkId: string; assignedGrade: number; updateTime: string;
}
interface ClassroomCourse {
  id: string; name: string; section?: string;
  descriptionHeading?: string; alternateLink?: string;
  announcements: Announcement[]; coursework: CourseWork[];
  gradedSubmissions: GradedSubmission[];
  turnedInIds: string[];
}


const WORK_TYPE_LABEL: Record<string, string> = {
  ASSIGNMENT:               'Assignment',
  SHORT_ANSWER_QUESTION:    'Short answer',
  MULTIPLE_CHOICE_QUESTION: 'MCQ',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr + 'T23:59:59').getTime() - Date.now()) / 86400000);
}

type AssignmentStatus = 'missing' | 'due-soon' | 'pending' | 'submitted' | 'graded';

function getAssignmentStatus(
  cw: CourseWork,
  isSubmitted: boolean,
  hasGrade: boolean,
): AssignmentStatus {
  if (hasGrade)    return 'graded';
  if (isSubmitted) return 'submitted'; 
  if (!cw.dueDate) return 'pending';
  const days = daysUntil(cw.dueDate);
  if (days < 0)              return 'missing';
  if (days === 0 || days === 1) return 'due-soon';
  return 'pending';
}

const STATUS_COLOR: Record<AssignmentStatus, string> = {
  missing:    '#E24B4A',
  'due-soon': '#EF9F27',
  pending:    '#378ADD',
  submitted:  '#1D9E75',
  graded:     '#EF9F27',
};

const STATUS_BADGE: Record<AssignmentStatus, string | null> = {
  missing:    'MISSING',
  'due-soon': null,
  pending:    null,
  submitted:  'SUBMITTED',
  graded:     null,
};

function urgencyLabel(days: number): { text: string; color: string } {
  if (days < 0)   return { text: 'OVERDUE',  color: '#E24B4A' };
  if (days === 0) return { text: 'TODAY',    color: '#E24B4A' };
  if (days === 1) return { text: 'TOMORROW', color: '#EF9F27' };
  if (days <= 3)  return { text: `${days}d`, color: '#EF9F27' };
  if (days <= 7)  return { text: `${days}d`, color: '#378ADD' };
  return { text: `${days}d`, color: 'var(--color-text-faint)' };
}

function gradeColor(pct: number | null): string {
  if (pct === null) return '#EF9F27';
  if (pct >= 90) return '#4ade80';
  if (pct >= 80) return '#a3e635';
  if (pct >= 70) return '#facc15';
  if (pct >= 60) return '#fb923c';
  return '#f87171';
}

function courseHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

interface DiffResult {
  newAnnouncements: { courseName: string; ann: Announcement }[];
  newCoursework:    { courseName: string; cw: CourseWork }[];
  newGrades:        { courseName: string; cw: CourseWork; grade: number; maxPoints?: number }[];
}

function diffCourses(prev: ClassroomCourse[], next: ClassroomCourse[]): DiffResult {
  const result: DiffResult = { newAnnouncements: [], newCoursework: [], newGrades: [] };
  for (const nc of next) {
    const pc = prev.find(c => c.id === nc.id);
    const prevAnnIds  = new Set(pc?.announcements.map(a => a.id) ?? []);
    const prevCwIds   = new Set(pc?.coursework.map(c => c.id) ?? []);
    const prevGradeIds = new Set(pc?.gradedSubmissions.map(g => g.courseWorkId) ?? []);

    for (const ann of nc.announcements)
      if (!prevAnnIds.has(ann.id))
        result.newAnnouncements.push({ courseName: nc.name, ann });

    for (const cw of nc.coursework)
      if (!prevCwIds.has(cw.id))
        result.newCoursework.push({ courseName: nc.name, cw });

    for (const g of nc.gradedSubmissions)
      if (!prevGradeIds.has(g.courseWorkId)) {
        const cw = nc.coursework.find(c => c.id === g.courseWorkId);
        if (cw) result.newGrades.push({ courseName: nc.name, cw, grade: g.assignedGrade, maxPoints: cw.maxPoints });
      }
  }
  return result;
}

async function fetchTokenFromDB(): Promise<string | null> {
  try { const res = await apiGetClassroomToken(); return res.token ?? null; } catch { return null; }
}
async function storeTokenInDB(token: string, expiresIn: number): Promise<void> {
  try { await apiSaveClassroomToken(token, expiresIn); } catch {}
}
async function clearTokenFromDB(): Promise<void> {
  try { await apiClearClassroomToken(); } catch {}
  localStorage.removeItem(LS_DATA_KEY);
}
function getCachedData(): ClassroomCourse[] | null {
  try { return JSON.parse(localStorage.getItem(LS_DATA_KEY) ?? 'null'); } catch { return null; }
}
function setCachedData(data: ClassroomCourse[]) {
  localStorage.setItem(LS_DATA_KEY, JSON.stringify(data));
}
function syncToCalendar(courses: ClassroomCourse[]) {
  try {
    const existing: any[] = JSON.parse(localStorage.getItem(CALENDAR_LS_KEY) ?? '[]');
    const filtered = existing.filter((i: any) => !i._fromClassroom);
    const items: any[] = [];
    courses.forEach(course => {
      course.coursework.forEach(cw => {
        if (!cw.dueDate) return;
        items.push({
          id: `gc_${cw.id}`, type: 'eval', title: cw.title,
          date: cw.dueDate, courseId: course.id, courseName: course.name,
          evalType: 'assignment', weightage: cw.maxPoints ?? 0,
          note: cw.description ?? '', done: false, _fromClassroom: true, _local: false,
        });
      });
    });
    localStorage.setItem(CALENDAR_LS_KEY, JSON.stringify([...filtered, ...items]));
  } catch {}
}

async function gFetch(path: string, token: string) {
  const res = await fetch(`https://classroom.googleapis.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('TOKEN_EXPIRED');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function fetchAllClassroomData(token: string): Promise<ClassroomCourse[]> {
  const { courses: rawCourses = [] } = await gFetch('/v1/courses?courseStates=ACTIVE&pageSize=30', token);
  const enriched = await Promise.all(
    rawCourses.map(async (course: any) => {
      const [annRes, cwRes, subRes, tiRes] = await Promise.allSettled([
        gFetch(`/v1/courses/${course.id}/announcements?pageSize=5&orderBy=updateTime%20desc`, token),
        gFetch(`/v1/courses/${course.id}/courseWork?pageSize=30&orderBy=dueDate%20desc`, token),
        gFetch(`/v1/courses/${course.id}/courseWork/-/studentSubmissions?states=RETURNED`, token),
        gFetch(`/v1/courses/${course.id}/courseWork/-/studentSubmissions?states=TURNED_IN`, token),
      ]);
      const announcements = annRes.status === 'fulfilled'
        ? (annRes.value.announcements ?? []).map((a: any) => ({
            id: a.id, text: a.text, creationTime: a.creationTime, updateTime: a.updateTime,
          })) : [];
      const coursework = cwRes.status === 'fulfilled'
        ? (cwRes.value.courseWork ?? []).map((cw: any) => ({
            id: cw.id, title: cw.title, description: cw.description,
            dueDate: cw.dueDate
              ? `${cw.dueDate.year}-${String(cw.dueDate.month).padStart(2,'0')}-${String(cw.dueDate.day).padStart(2,'0')}`
              : null,
            maxPoints: cw.maxPoints, workType: cw.workType,
            state: cw.state, alternateLink: cw.alternateLink,
          })) : [];
      const gradedSubmissions = subRes.status === 'fulfilled'
        ? (subRes.value.studentSubmissions ?? [])
            .filter((s: any) => s.assignedGrade != null)
            .map((s: any) => ({ courseWorkId: s.courseWorkId, assignedGrade: s.assignedGrade, updateTime: s.updateTime }))
        : [];
      const tiIds: string[] = tiRes.status === 'fulfilled'
        ? (tiRes.value.studentSubmissions ?? []).map((s: any) => s.courseWorkId)
        : [];
      const gradedIds = gradedSubmissions.map((s: any) => s.courseWorkId);
      const turnedInIds = Array.from(new Set([...tiIds, ...gradedIds]));
      return {
        id: course.id, name: course.name, section: course.section,
        descriptionHeading: course.descriptionHeading, alternateLink: course.alternateLink,
        announcements, coursework, gradedSubmissions, turnedInIds,
      };
    })
  );
  return enriched;
}

function StatCard({ label, value, sub, accentColor, borderColor, active }: {
  label: string; value: string | number; sub?: string;
  accentColor: string; borderColor: string; active?: boolean;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: active ? `${accentColor}10` : 'var(--color-glass)',
      border: `1px solid ${active ? borderColor : 'var(--color-glass-border)'}`,
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 800, color: accentColor, lineHeight: 1.1, fontFamily: 'monospace' }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{sub}</span>}
    </div>
  );
}

function CoursePill({ course, isSelected, hasCritical, isSynced, onClick }: {
  course: ClassroomCourse; isSelected: boolean; hasCritical: boolean; isSynced?: boolean; onClick: () => void;
}) {
  const hue = courseHue(course.name);
  const pendingCount = course.coursework.filter(
    cw => cw.dueDate && daysUntil(cw.dueDate) >= 0 && !course.turnedInIds.includes(cw.id)
  ).length;
  return (
    <button onClick={onClick} title={course.name} style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 16px', borderRadius: 99,
      border: `1.5px solid ${isSelected ? `hsl(${hue},70%,55%)` : 'var(--color-glass-border)'}`,
      background: isSelected ? `hsl(${hue},70%,55%)18` : 'transparent',
      color: isSelected ? `hsl(${hue},70%,60%)` : 'var(--color-text-muted)',
      fontSize: 13, fontWeight: isSelected ? 700 : 500,
      cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (isSelected) return; (e.currentTarget as HTMLElement).style.borderColor = `hsl(${hue},70%,55%)`; (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'; }}
    onMouseLeave={e => { if (isSelected) return; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-glass-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'; }}
    >
      {hasCritical && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E24B4A', flexShrink: 0, boxShadow: '0 0 0 2px rgba(226,75,74,0.2)' }} />}
      <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.name}</span>
      {pendingCount > 0 && (
        <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: isSelected ? `hsl(${hue},70%,55%)25` : 'var(--color-glass-border)', color: isSelected ? `hsl(${hue},70%,60%)` : 'var(--color-text-faint)' }}>{pendingCount}</span>
      )}
      {isSynced && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-brand)', flexShrink: 0, boxShadow: '0 0 4px var(--color-brand)' }} title="Synced to dashboard" />}
    </button>
  );
}

function AssignmentRow({ cw, isSubmitted, grade }: {
  cw: CourseWork; isSubmitted: boolean; grade?: GradedSubmission;
}) {
  const hasGrade = !!grade;
  const status = getAssignmentStatus(cw, isSubmitted, hasGrade);
  const borderColor = STATUS_COLOR[status];
  const statusBadge = STATUS_BADGE[status];
  const days = cw.dueDate ? daysUntil(cw.dueDate) : null;
  const urgency = days !== null && !isSubmitted && !hasGrade ? urgencyLabel(days) : null;
  const pct = grade && cw.maxPoints ? Math.round((grade.assignedGrade / cw.maxPoints) * 100) : null;
  const gc = gradeColor(pct);
  const metaParts = [WORK_TYPE_LABEL[cw.workType] ?? cw.workType, cw.maxPoints != null ? `${cw.maxPoints} pts` : null].filter(Boolean).join(' · ');

  return (
    <div
      onClick={() => cw.alternateLink && window.open(cw.alternateLink, '_blank')}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)',
        borderLeft: `4px solid ${borderColor}`, borderRadius: 8,
        padding: '13px 16px 13px 14px',
        cursor: cw.alternateLink ? 'pointer' : 'default', transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => { if (cw.alternateLink) (e.currentTarget as HTMLElement).style.background = 'var(--color-active-bg)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-glass)'; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{cw.title}</p>
          {statusBadge && (
            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: `${borderColor}18`, color: borderColor, border: `1px solid ${borderColor}35`, letterSpacing: '0.05em' }}>{statusBadge}</span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{metaParts}</p>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 64 }}>
        {hasGrade ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: gc, lineHeight: 1, fontFamily: 'monospace' }}>
              {grade!.assignedGrade}
              {cw.maxPoints && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}>/{cw.maxPoints}</span>}
            </div>
            {pct !== null && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: gc, marginTop: 1 }}>{pct}%</div>
                <div style={{ marginTop: 4, width: 48, height: 2, borderRadius: 2, background: 'var(--color-glass-border)', marginLeft: 'auto' }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 2, background: gc }} />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {cw.dueDate && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{fmtDateShort(cw.dueDate)}</div>}
            {urgency && <div style={{ fontSize: 12, fontWeight: 800, color: urgency.color, fontFamily: 'monospace', marginTop: 1 }}>{urgency.text}</div>}
          </>
        )}
      </div>
    </div>
  );
}

function GradeRow({ sub, coursework }: { sub: GradedSubmission; coursework: CourseWork[] }) {
  const cw = coursework.find(c => c.id === sub.courseWorkId);
  const pct = cw?.maxPoints ? Math.round((sub.assignedGrade / cw.maxPoints) * 100) : null;
  const gc = gradeColor(pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderLeft: `4px solid ${gc}`, borderRadius: 8 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: `${gc}14`, border: `1px solid ${gc}28`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {pct !== null ? <span style={{ fontSize: 12, fontWeight: 900, color: gc, lineHeight: 1, fontFamily: 'monospace' }}>{pct}%</span> : <Trophy style={{ width: 14, height: 14, color: gc }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{cw?.title ?? 'Assignment'}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Returned {timeAgo(sub.updateTime)}
          {cw?.workType && <span style={{ marginLeft: 6, color: 'var(--color-text-faint)' }}>· {WORK_TYPE_LABEL[cw.workType] ?? cw.workType}</span>}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: gc, lineHeight: 1, fontFamily: 'monospace' }}>
          {sub.assignedGrade}{cw?.maxPoints && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}>/{cw.maxPoints}</span>}
        </div>
        {pct !== null && (
          <div style={{ marginTop: 6, width: 56, height: 3, borderRadius: 3, background: 'var(--color-glass-border)', marginLeft: 'auto' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: gc, transition: 'width 0.4s ease' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = ann.text.length > 240;
  return (
    <div style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderLeft: '4px solid #EF9F27', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Megaphone style={{ width: 13, height: 13, color: '#EF9F27', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#EF9F27', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Announcement</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{timeAgo(ann.updateTime)}</span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {isLong && !expanded ? ann.text.slice(0, 240) + '…' : ann.text}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(v => !v)} style={{ marginTop: 12, fontSize: 12, color: 'var(--color-brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          {expanded ? <><ChevronUp style={{ width: 12, height: 12 }} />Show less</> : <><ChevronDown style={{ width: 12, height: 12 }} />Read more</>}
        </button>
      )}
      <p style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 12 }}>{fmtDate(ann.creationTime)}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: 24, height: 24, color: 'var(--color-text-faint)' }} />
      </div>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center' }}>{message}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 8, marginTop: 6 }}>{children}</p>;
}

function NextRefreshBadge({ nextRefreshAt }: { nextRefreshAt: number }) {
  const [secsLeft, setSecsLeft] = useState(() => Math.max(0, Math.round((nextRefreshAt - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setSecsLeft(Math.max(0, Math.round((nextRefreshAt - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [nextRefreshAt]);
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  return (
    <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ opacity: 0.5 }}>auto in</span>
      {mins > 0 ? `${mins}m ${String(secs).padStart(2,'0')}s` : `${secs}s`}
    </span>
  );
}

export default function ClassroomPage() {
  const [linked, setLinked]             = useState(false);
  const [initialAuthChecking, setInitialAuthChecking] = useState(true);
  const [courses, setCourses]           = useState<ClassroomCourse[]>(() => getCachedData() ?? []);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<'work' | 'grades' | 'announcements'>('work');
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterType, setFilterType]     = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [showPast, setShowPast]         = useState(false);
  const [nextRefreshAt, setNextRefreshAt] = useState(Date.now() + AUTO_REFRESH_MS);
  const [syncingCourse, setSyncingCourse] = useState<ClassroomCourse | null>(null);
  const [syncQueue, setSyncQueue]       = useState<ClassroomCourse[]>([]);
  const [syncedIds, setSyncedIds]       = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('semsync_synced_classroom_ids') ?? '[]')); } catch { return new Set(); }
  });

  const pillRailRef    = useRef<HTMLDivElement>(null);
  const coursesRef     = useRef<ClassroomCourse[]>(courses);
  const autoTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstLoad    = useRef(true);

  useEffect(() => { coursesRef.current = courses; }, [courses]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'semsync_synced_classroom_ids') {
        try { setSyncedIds(new Set(JSON.parse(e.newValue ?? '[]'))); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const loadData = useCallback(async (token: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchAllClassroomData(token);

      if (!isFirstLoad.current && coursesRef.current.length > 0) {
        const diff = diffCourses(coursesRef.current, data);

      }
      isFirstLoad.current = false;

      setCourses(data);
      setCachedData(data);
      syncToCalendar(data);
      if (data.length && !selectedId) setSelectedId(data[0].id);
    } catch (e: any) {
      if (e.message === 'TOKEN_EXPIRED') {
        await clearTokenFromDB(); setLinked(false);
        setError('Session expired. Please re-link Google Classroom.');
      } else {
        setError(e.message ?? 'Failed to load Classroom data');
      }
    } finally { if (!silent) setLoading(false); }
  }, [selectedId]);

  const scheduleAutoRefresh = useCallback((token: string) => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    setNextRefreshAt(Date.now() + AUTO_REFRESH_MS);
    autoTimerRef.current = setInterval(async () => {
      const t = await fetchTokenFromDB();
      if (t) { await loadData(t, true); }
      else { clearInterval(autoTimerRef.current!); setLinked(false); }
      setNextRefreshAt(Date.now() + AUTO_REFRESH_MS);
    }, AUTO_REFRESH_MS);
  }, [loadData]);

  useEffect(() => {
    fetchTokenFromDB().then(token => {
      setInitialAuthChecking(false);
      if (!token) return;
      setLinked(true);
      const cached = getCachedData();
      if (!cached || cached.length === 0) {
        loadData(token);
      } else {
        if (!selectedId) setSelectedId(cached[0].id);
        isFirstLoad.current = false;
      }
      scheduleAutoRefresh(token);
    });
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, []);

  const connectClassroom = useGoogleLogin({
    flow: 'implicit', scope: CLASSROOM_SCOPES,
    onSuccess: async (tr) => {
      await storeTokenInDB(tr.access_token, tr.expires_in ?? 3600);
      setLinked(true); isFirstLoad.current = true;
      await loadData(tr.access_token);
      scheduleAutoRefresh(tr.access_token);
    },
    onError: () => setError('Google login failed. Please try again.'),
  });

  const handleUnlink = async () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    await clearTokenFromDB();
    try {
      const existing: any[] = JSON.parse(localStorage.getItem(CALENDAR_LS_KEY) ?? '[]');
      localStorage.setItem(CALENDAR_LS_KEY, JSON.stringify(existing.filter((i: any) => !i._fromClassroom)));
    } catch {}
    setLinked(false); setCourses([]); setSelectedId(null); isFirstLoad.current = true;
  };

  const handleRefresh = async () => {
    const token = await fetchTokenFromDB();
    if (token) { await loadData(token); scheduleAutoRefresh(token); }
    else { await clearTokenFromDB(); setLinked(false); }
  };

  const selectCourse = (id: string) => {
    setSelectedId(id); setActiveTab('work'); setSearchQuery(''); setFilterType('all'); setShowPast(false);
  };

  const selected = courses.find(c => c.id === selectedId);

  const allWork = selected
    ? [...selected.coursework].filter(cw => cw.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    : [];

  const filteredWork = useMemo(() => {
    if (!selected) return [];
    return allWork.filter(cw => {
      const isSubmitted = selected.turnedInIds.includes(cw.id);
      const grade = selected.gradedSubmissions.find(s => s.courseWorkId === cw.id);
      if (filterType === 'pending'   && (isSubmitted || !!grade)) return false;
      if (filterType === 'submitted' && !isSubmitted && !grade)    return false;
      if (filterType === 'graded'    && !grade)                    return false;
      if (searchQuery) return cw.title.toLowerCase().includes(searchQuery.toLowerCase());
      return true;
    });
  }, [allWork, filterType, searchQuery, selected]);

  const upcomingWork = filteredWork.filter(cw => daysUntil(cw.dueDate!) >= 0);
  const pastWork     = filteredWork.filter(cw => daysUntil(cw.dueDate!) < 0);

  const totalDueToday = courses.reduce((n, c) => n + c.coursework.filter(cw => cw.dueDate && daysUntil(cw.dueDate) === 0 && !c.turnedInIds.includes(cw.id)).length, 0);
  const totalDueWeek  = courses.reduce((n, c) => n + c.coursework.filter(cw => cw.dueDate && daysUntil(cw.dueDate) >= 0 && daysUntil(cw.dueDate) <= 7 && !c.turnedInIds.includes(cw.id)).length, 0);

  let totalPoints = 0, earnedPoints = 0;
  courses.forEach(c => c.gradedSubmissions.forEach(sub => {
    const cw = c.coursework.find(w => w.id === sub.courseWorkId);
    if (cw?.maxPoints) { totalPoints += cw.maxPoints; earnedPoints += sub.assignedGrade; }
  }));
  const avgGrade = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid var(--color-glass-border)', flexShrink: 0, background: 'var(--color-bg)', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <GraduationCap style={{ width: 20, height: 20, color: 'var(--color-brand)', flexShrink: 0 }} />
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {linked && selected ? selected.name : 'Google Classroom'}
            </h1>
            {selected?.section && <span style={{ fontSize: 13, color: 'var(--color-text-faint)', flexShrink: 0 }}>{selected.section}</span>}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {linked && courses.length > 0 && !loading && <NextRefreshBadge nextRefreshAt={nextRefreshAt} />}
            {linked && selected?.alternateLink && (
              <a href={selected.alternateLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <ArrowUpRight style={{ width: 13, height: 13 }} />Open
              </a>
            )}

            {linked && (
              <>
                {loading && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-muted)' }}><Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />Syncing…</span>}
                <button onClick={handleRefresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
                  <RefreshCw style={{ width: 13, height: 13 }} />Refresh
                </button>
                <button onClick={handleUnlink} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, background: 'rgba(226,75,74,0.07)', border: '1px solid rgba(226,75,74,0.2)', color: '#E24B4A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Link2Off style={{ width: 13, height: 13 }} />Unlink
                </button>
              </>
            )}
          </div>
        </div>

        {initialAuthChecking && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--color-glass-border)' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--color-brand)', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px solid transparent', borderTopColor: 'rgba(34,197,94,0.4)', animation: 'spin 1.4s linear infinite reverse' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap style={{ width: 20, height: 20, color: 'var(--color-brand)' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Connecting to Classroom</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Checking your session…</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-brand)', opacity: 0.4, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {!initialAuthChecking && !linked && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ textAlign: 'center', maxWidth: 380 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, margin: '0 auto 20px', background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap style={{ width: 32, height: 32, color: 'var(--color-brand)' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', marginBottom: 10, letterSpacing: '-0.02em' }}>Link Google Classroom</h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                Connect your account to view courses, track deadlines, see grades, and sync everything to your calendar.
              </p>
              {error && (
                <div style={{ marginBottom: 16, padding: '11px 16px', borderRadius: 8, background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)', color: '#E24B4A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />{error}
                </div>
              )}
              <button onClick={() => connectClassroom()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 26px', borderRadius: 8, background: 'var(--color-brand)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 24px var(--color-brand-glow)' }}>
                <Link2 style={{ width: 14, height: 14 }} />Connect Classroom
              </button>
              <p style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-faint)' }}>Read-only access · data stays local</p>
            </div>
          </div>
        )}

        {!initialAuthChecking && linked && loading && courses.length === 0 && (
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 0.7, 0.5].map((op, i) => (
                <div key={i} style={{ flex: 1, height: 72, borderRadius: 8, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', opacity: op, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              {[120, 90, 140, 100, 110].map((w, i) => (
                <div key={i} style={{ width: w, height: 28, borderRadius: 99, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 0.85, 0.7, 0.6].map((op, i) => (
                <div key={i} style={{ height: 64, borderRadius: 8, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', opacity: op, animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'center', marginTop: 8 }}>Fetching your classroom data…</p>
          </div>
        )}

        {/* Error */}
        {linked && error && courses.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <WifiOff style={{ width: 24, height: 24, color: '#E24B4A' }} />
            <p style={{ fontSize: 14, color: '#E24B4A', fontWeight: 600 }}>{error}</p>
            <button onClick={handleRefresh} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--color-brand)', color: '#fff', fontSize: 13, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Try again</button>
          </div>
        )}

        {linked && courses.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

            <div style={{ display: 'flex', gap: 10, padding: '14px 28px', borderBottom: '1px solid var(--color-glass-border)', flexShrink: 0 }}>
              <StatCard label="Due today" value={totalDueToday} sub={totalDueToday === 0 ? 'all clear' : `${totalDueToday} assignment${totalDueToday > 1 ? 's' : ''}`} accentColor="#E24B4A" borderColor="rgba(226,75,74,0.4)" active={totalDueToday > 0} />
              <StatCard label="This week" value={totalDueWeek} sub="due in 7 days" accentColor="#EF9F27" borderColor="rgba(239,159,39,0.4)" />
              <StatCard label="Courses" value={courses.length} sub="active this term" accentColor="var(--color-brand)" borderColor="var(--color-brand)" />
            </div>

            <div style={{ borderBottom: '1px solid var(--color-glass-border)', flexShrink: 0, WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)', maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)' }}>
              <div ref={pillRailRef} style={{ display: 'flex', gap: 8, padding: '12px 28px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {courses.map(course => {
                  const hasCritical = course.coursework.some(cw => cw.dueDate && daysUntil(cw.dueDate) >= 0 && daysUntil(cw.dueDate) <= 1 && !course.turnedInIds.includes(cw.id));
                  return <CoursePill key={course.id} course={course} isSelected={selectedId === course.id} hasCritical={hasCritical} isSynced={syncedIds.has(course.id)} onClick={() => selectCourse(course.id)} />;
                })}
              </div>
            </div>

            {selected && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid var(--color-glass-border)', flexShrink: 0, gap: 8 }}>
                  <div style={{ display: 'flex', gap: 0 }}>
                    {([
                      { key: 'work',          label: 'Coursework',    icon: BookOpen,  count: selected.coursework.filter(cw => cw.dueDate).length },
                      { key: 'grades',        label: 'Grades',        icon: Trophy,    count: selected.gradedSubmissions.length },
                      { key: 'announcements', label: 'Announcements', icon: Megaphone, count: selected.announcements.length },
                    ] as const).map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, background: 'transparent', color: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-text-muted)', borderBottom: activeTab === tab.key ? '2px solid var(--color-brand)' : '2px solid transparent', marginBottom: -1, transition: 'all 0.12s', whiteSpace: 'nowrap' }}>
                        <tab.icon style={{ width: 14, height: 14 }} />
                        {tab.label}
                        {tab.count > 0 && <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800, background: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-glass-border)', color: activeTab === tab.key ? '#fff' : 'var(--color-text-muted)' }}>{tab.count}</span>}
                      </button>
                    ))}
                  </div>
                  {activeTab === 'work' && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: 99, padding: '5px 12px' }}>
                        <Search style={{ width: 12, height: 12, color: 'var(--color-text-faint)', flexShrink: 0 }} />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search…" style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-text)', width: 110 }} />
                      </div>
                      {(['all', 'pending', 'submitted', 'graded'] as const).map(f => (
                        <button key={f} onClick={() => setFilterType(f)} style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.12s', border: filterType === f ? '1.5px solid var(--color-brand)' : '1px solid var(--color-glass-border)', background: filterType === f ? 'var(--color-active-bg)' : 'transparent', color: filterType === f ? 'var(--color-brand)' : 'var(--color-text-faint)' }}>{f}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeTab === 'work' && (
                    <>
                      {upcomingWork.length === 0 && pastWork.length === 0 && <EmptyState icon={CheckCircle2} message={searchQuery || filterType !== 'all' ? 'No assignments match your filter.' : 'No coursework with due dates.'} />}
                      {upcomingWork.length > 0 && (
                        <>
                          <SectionLabel>Upcoming · {upcomingWork.length}</SectionLabel>
                          {upcomingWork.map(cw => <AssignmentRow key={cw.id} cw={cw} isSubmitted={selected.turnedInIds.includes(cw.id)} grade={selected.gradedSubmissions.find(s => s.courseWorkId === cw.id)} />)}
                        </>
                      )}
                      {pastWork.length > 0 && (
                        <>
                          <button onClick={() => setShowPast(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '9px 14px', background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.12s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'}>
                            {showPast ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                            Past · {pastWork.length} item{pastWork.length !== 1 ? 's' : ''}
                          </button>
                          {showPast && pastWork.map(cw => <AssignmentRow key={cw.id} cw={cw} isSubmitted={selected.turnedInIds.includes(cw.id)} grade={selected.gradedSubmissions.find(s => s.courseWorkId === cw.id)} />)}
                        </>
                      )}
                    </>
                  )}
                  {activeTab === 'grades' && (
                    selected.gradedSubmissions.length === 0
                      ? <EmptyState icon={Star} message="No graded submissions yet." />
                      : [...selected.gradedSubmissions].sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()).map(sub => <GradeRow key={sub.courseWorkId} sub={sub} coursework={selected.coursework} />)
                  )}
                  {activeTab === 'announcements' && (
                    selected.announcements.length === 0
                      ? <EmptyState icon={Megaphone} message="No announcements." />
                      : [...selected.announcements].sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()).map(ann => <AnnouncementCard key={ann.id} ann={ann} />)
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {syncingCourse && (
        <SyncCourseModal
          course={syncingCourse}
          queueRemaining={syncQueue.length}
          onClose={() => { setSyncingCourse(null); setSyncQueue([]); }}
          onSynced={(created) => {
            const newIds = new Set([...syncedIds, syncingCourse.id]);
            setSyncedIds(newIds);
            localStorage.setItem('semsync_synced_classroom_ids', JSON.stringify([...newIds]));
            invalidateAllCourseData();
            if (syncQueue.length > 0) {
              const [next, ...rest] = syncQueue;
              setSyncQueue(rest);
              setSyncingCourse(next);
            } else {
              setSyncingCourse(null);
            }
          }}
        />
      )}
    </div>
  );
}