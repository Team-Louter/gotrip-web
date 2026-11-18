import { API_BASE_URL, apiRequest } from '../api/client';
import defaultProfileImage from '../images/gotrip-pro.jpg';
import { getChatRoomProfileImage } from '../data/chatRoomProfileStore.js';

const memberPath = '/api/members/me';

export const DEFAULT_PROFILE_IMAGE = defaultProfileImage;

export function chatCounterpartProfileImageSource(room) {
  const imageUrl = room?.roomProfileImage
    || getChatRoomProfileImage(room?.id)
    || room?.counterpartProfileImageUrl
    || room?.partnerProfileImageUrl
    || room?.profileImageUrl
    || room?.otherMember?.profileImageUrl;

  return profileImageSource(imageUrl) || '';
}

export function chatCounterpartProfileImage(room) {
  return profileImageSource(room?.roomProfileImage || room?.counterpartProfileImageUrl) || DEFAULT_PROFILE_IMAGE;
}

export const fetchAccountDetails = () => apiRequest(memberPath);
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
