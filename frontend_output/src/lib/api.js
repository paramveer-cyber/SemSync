const BASE = 'https://semsyncbackend.vercel.app';

const getToken = () => localStorage.getItem('ct_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    (error).status = res.status;
    (error).data = data;
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

export const getEvals = (courseId) => request('GET', `/courses/${courseId}/evaluations`);
export const createEval = (courseId, data) => request('POST', `/courses/${courseId}/evaluations`, data);
export const updateEval = (id, data) => request('PATCH', `/evaluations/${id}`, data);
export const deleteEval = (id) => request('DELETE', `/evaluations/${id}`);
export const getUpcomingEvals = () => request('GET', '/evaluations/upcoming');
