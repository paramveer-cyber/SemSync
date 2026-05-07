// const BASE = 'http://localhost:3000';
const BASE = 'https://semsyncbackend.vercel.app';

import { getToken, setToken, clearToken } from './tokenStore.js';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

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
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (!refreshRes.ok) throw new Error(refreshData.message || 'Refresh failed');
      setToken(refreshData.token);
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

export const getClassroomToken = () => request('GET', '/auth/classroom-token');
export const saveClassroomToken = (accessToken, expiresIn) => request('POST', '/auth/classroom-token', { accessToken, expiresIn });
export const clearClassroomToken = () => request('DELETE', '/auth/classroom-token');
export const deleteAccount = () => request('DELETE', '/auth/account');
