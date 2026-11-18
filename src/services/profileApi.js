import { API_BASE_URL, apiRequest } from '../api/client';
import defaultProfileImage from '../images/gotrip-pro.jpg';
import { getChatRoomProfileImage } from '../data/chatRoomProfileStore.js';

const memberPath = '/api/members/me';

export const DEFAULT_PROFILE_IMAGE = defaultProfileImage;

export function canEditChatRoomProfile(room) {
  return Array.isArray(room?.otherMembers) && room.otherMembers.length > 1;
}

export function chatCounterpartProfileImageSource(room) {
  if (Array.isArray(room?.otherMembers)) {
    if (room.otherMembers.length === 1) {
      return profileImageSource(room.otherMembers[0]?.profileImageUrl || room.counterpartProfileImageUrl) || '';
    }
    return profileImageSource(room.roomProfileImage || getChatRoomProfileImage(room?.id)) || '';
  }
  const imageUrl = room?.roomProfileImage
    || getChatRoomProfileImage(room?.id)
    || room?.counterpartProfileImageUrl
    || room?.partnerProfileImageUrl
    || room?.profileImageUrl
    || room?.otherMember?.profileImageUrl;

  return profileImageSource(imageUrl) || '';
}

export function chatCounterpartProfileImage(room) {
  if (Array.isArray(room?.otherMembers)) {
    const imageUrl = room.otherMembers.length === 1
      ? room.otherMembers[0]?.profileImageUrl || room.counterpartProfileImageUrl
      : room.roomProfileImage || getChatRoomProfileImage(room?.id);
    return profileImageSource(imageUrl) || DEFAULT_PROFILE_IMAGE;
  }
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
