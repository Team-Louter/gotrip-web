import { API_BASE_URL, apiRequest } from '../api/client';
import defaultProfileImage from '../images/gotrip-pro.jpg';

const memberPath = '/api/members/me';

export const DEFAULT_PROFILE_IMAGE = defaultProfileImage;

export function chatCounterpartProfileImageSource(room) {
  const otherMember = room?.members?.find((member) => member?.profileImageUrl || member?.avatarUrl);
  const latestIncomingMessage = [...(room?.messages ?? [])].reverse().find((message) => !message.mine);
  const imageUrl = room?.roomProfileImage
    || room?.counterpartProfileImageUrl
    || room?.partnerProfileImageUrl
    || room?.profileImageUrl
    || room?.otherMember?.profileImageUrl
    || otherMember?.profileImageUrl
    || otherMember?.avatarUrl
    || latestIncomingMessage?.senderProfileImageUrl
    || latestIncomingMessage?.profileImageUrl;

  return profileImageSource(imageUrl) || '';
}

export function chatCounterpartProfileImage(room) {
  return chatCounterpartProfileImageSource(room) || DEFAULT_PROFILE_IMAGE;
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
