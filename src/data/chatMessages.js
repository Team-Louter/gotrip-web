export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😍', '😮', '😢', '🎉', '🙏'];
export const MAX_IMAGE_COUNT = 3;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function httpUrl(value) {
  let url;
  try { url = new URL(String(value).trim()); } catch { throw new Error('http:// 또는 https://로 시작하는 링크를 입력해 주세요.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('http:// 또는 https://로 시작하는 링크를 입력해 주세요.');
  return url.href;
}

export function imageUrl(value) {
  if (/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  return httpUrl(value);
}

export function normalizeAttachment(attachment) {
  if (attachment.type === 'link') return { id: attachment.id || crypto.randomUUID(), type: 'link', url: httpUrl(attachment.url) };
  if (attachment.type !== 'image') throw new Error('지원하지 않는 첨부 형식입니다.');
  return { ...attachment, id: attachment.id || crypto.randomUUID(), url: imageUrl(attachment.url), name: attachment.name || '첨부 이미지', size: Number(attachment.size) || 0 };
}

export function validateImages(files, existing = []) {
  if (files.length + existing.length > MAX_IMAGE_COUNT) throw new Error('이미지는 한 번에 최대 3장까지 첨부할 수 있어요.');
  if (files.some((file) => !imageTypes.includes(file.type) || file.size <= 0)) throw new Error('JPG, PNG, GIF, WebP 이미지를 선택해 주세요.');
  if (files.reduce((total, file) => total + file.size, existing.reduce((total, item) => total + (item.size || 0), 0)) > MAX_IMAGE_BYTES) {
    throw new Error('첨부 이미지의 전체 크기는 2MB 이하여야 해요.');
  }
}

export function messagePreview(message) {
  if (!message || message.deleted) return '삭제된 메시지입니다.';
  return message.content || (message.attachments?.some((item) => item.type === 'image') ? '사진' : '링크');
}
