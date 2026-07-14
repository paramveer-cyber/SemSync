import * as api from './api';
import {
    cacheGet,
    cacheSet,
    cacheHas,
    cacheInvalidate,
    cacheClear,
    dedupe,
    CACHE_KEYS,
} from './sessionCache';

export interface Evaluation {
    id: string;
    courseId: string;
    title: string;
    type: string;
    date: string;
    weightage: number;
    maxScore: number;
    score: number | null;
    minutesSpent: number;
}

export interface CourseStats {
    currentGrade: number;
    earnedWeight: number;
    totalWeight: number;
    remainingWeight: number;
    requiredAvg: number | null;
}

export interface Course {
    id: string;
    userId: string;
    name: string;
    credits: number | null;
    targetGrade: number;
    isArchived: boolean;
    evaluations: Evaluation[];
    stats: CourseStats;
}

export interface CourseDetail {
    course: Omit<Course, 'evaluations' | 'stats'>;
    evaluations: Evaluation[];
    stats: CourseStats;
}

async function primeCache(): Promise<void> {
    const [{ courses: rawCourses }, { evaluations: upcomingEvals }] =
        await Promise.all([api.getCourses(), api.getUpcomingEvals()]);

    cacheSet(CACHE_KEYS.courses, rawCourses);
    cacheSet(CACHE_KEYS.upcomingEvals, upcomingEvals);
}

export async function fetchCourses(): Promise<Course[]> {
    if (!cacheHas(CACHE_KEYS.courses)) {
        await dedupe('primeCache', primeCache);
    }
    return cacheGet<Course[]>(CACHE_KEYS.courses) ?? [];
}

export async function fetchUpcomingEvals(): Promise<Evaluation[]> {
    if (!cacheHas(CACHE_KEYS.upcomingEvals)) {
        await dedupe('primeCache', primeCache);
    }
    return cacheGet<Evaluation[]>(CACHE_KEYS.upcomingEvals) ?? [];
}

export async function fetchCourse(id: string): Promise<CourseDetail> {
    if (!cacheHas(CACHE_KEYS.course(id))) {
        await dedupe('primeCache', primeCache);
    }

    const cached = cacheGet<CourseDetail | null>(CACHE_KEYS.course(id));

    if (cached === null || cached === undefined) {
        return dedupe(`course:${id}`, async () => {
            const detail: CourseDetail = await api.getCourse(id);
            cacheSet(CACHE_KEYS.course(id), detail);
            return detail;
        });
    }

    return cached;
}

export async function fetchArchivedCourses(): Promise<Course[]> {
    if (!cacheHas(CACHE_KEYS.archivedCourses)) {
        await dedupe('archivedCourses', async () => {
            const { courses } = await api.getArchivedCourses();
            cacheSet(CACHE_KEYS.archivedCourses, courses);
        });
    }
    return cacheGet<Course[]>(CACHE_KEYS.archivedCourses) ?? [];
}

export function invalidateAllCourseData(): void {
    cacheClear();
}

export function invalidateCourseDetail(courseId: string): void {
    cacheInvalidate(CACHE_KEYS.course(courseId), CACHE_KEYS.upcomingEvals);
}

export function invalidateOnLogout(): void {
    cacheClear();
}
