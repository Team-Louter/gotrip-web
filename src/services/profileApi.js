import { API_BASE_URL, apiRequest } from '../api/client';

const memberPath = '/api/members/me';

export const fetchAccountDetails = () => apiRequest(memberPath + '/account-details');
export const fetchProfile = (signal) => apiRequest(memberPath, { signal });
export const updateNickname = (nickname) => apiRequest(memberPath + '/nickname', { method: 'PUT', body: { nickname } });
export const deleteAccount = () => apiRequest(memberPath, { method: 'DELETE' });

export function updateProfileImage(file) {
  const body = new FormData();
  body.append('file', file);
  return apiRequest(memberPath + '/profile-image', { method: 'PUT', body });
}

export function profileImageSource(url) {
  return url?.startsWith('/') && !url.startsWith('//') ? API_BASE_URL + url : url;
}
