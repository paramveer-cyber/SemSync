const BASE = import.meta.env.VITE_BASE_URL ?? '';

import { getToken, setToken, clearToken } from './tokenStore.js';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

let refreshInFlight = null;

export const doRefresh = async () => {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (!refreshRes.ok) throw new Error(refreshData.message || 'Refresh failed');
      setToken(refreshData.token);
      window.dispatchEvent(new Event('auth:login'));
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

const request = async (method, path, body, _retry = false) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && data.code === 'TOKEN_EXPIRED' && !_retry) {
    try {
      await doRefresh();
      return request(method, path, body, true);
    } catch {
      clearToken();
      window.dispatchEvent(new Event('auth:logout'));
      const error = new Error('Session expired');
      error.status = 401;
      throw error;
    }
  }

  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const authGoogle = (idToken) => request('POST', '/auth/google', { idToken });
export const authMe = () => request('GET', '/auth/me');
export const authLogout = () => request('POST', '/auth/logout');

export const getCourses = () => request('GET', '/courses');
export const getCourse = (id) => request('GET', `/courses/${id}`);
export const createCourse = (data) => request('POST', '/courses', data);
export const updateCourse = (id, data) => request('PATCH', `/courses/${id}`, data);
export const deleteCourse = (id) => request('DELETE', `/courses/${id}`);
export const archiveCourse = (id) => request('POST', `/courses/${id}/archive`);
export const getArchivedCourses = () => request('GET', '/courses/archived');

export const getEvals = (courseId) => request('GET', `/courses/${courseId}/evaluations`);
export const createEval = (courseId, data) => request('POST', `/courses/${courseId}/evaluations`, data);
export const updateEval = (id, data) => request('PATCH', `/evaluations/${id}`, data);
export const deleteEval = (id) => request('DELETE', `/evaluations/${id}`);
export const getUpcomingEvals = () => request('GET', '/evaluations/upcoming');

export const sendClassroomAuthCode = (authCode) => request('POST', '/auth/classroom-connect', { authCode });
export const getClassroomToken = () => request('GET', '/auth/classroom-token');
export const clearClassroomToken = () => request('DELETE', '/auth/classroom-token');
export const deleteAccount = () => request('DELETE', '/auth/account');
export const exportUserData = () => request('GET', '/auth/export');

export const getGamificationDashboard = () => request('GET', '/focus/dashboard');

export const timerGet = () => request('GET', '/focus/');
export const timerStart = (data) => request('POST', '/focus/start', data);
export const timerPause = () => request('POST', '/focus/pause');
export const timerResume = () => request('POST', '/focus/resume');
export const timerExtend = (addMinutes) => request('POST', '/focus/extend', { addMinutes });
export const timerSync = () => request('POST', '/focus/sync');
export const timerEnd = (data) => request('POST', '/focus/end', data);

export const trackPageVisit = (page) => request('POST', '/focus/track/page', { page });
export const trackTask = (action) => request('POST', '/focus/track/task', { action });

export const getAchievementCatalog = () => request('GET', '/achievements/catalog');