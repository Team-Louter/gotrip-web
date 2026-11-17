const PROFILE_IMAGE_SIZE = 320;
const MAX_PROFILE_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_PROFILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function prepareChatRoomProfileImage(file) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_PROFILE_TYPES.has(file.type)) {
      reject(new Error('JPG, PNG 또는 WebP 사진을 선택해 주세요.'));
      return;
    }
    if (file.size > MAX_PROFILE_FILE_SIZE) {
      reject(new Error('프로필 사진은 8MB 이하로 선택해 주세요.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('이미지 파일을 확인해 주세요.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = PROFILE_IMAGE_SIZE;
        canvas.height = PROFILE_IMAGE_SIZE;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('사진을 준비하지 못했습니다.'));
          return;
        }
        const scale = Math.max(PROFILE_IMAGE_SIZE / image.width, PROFILE_IMAGE_SIZE / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE);
        context.drawImage(image, (PROFILE_IMAGE_SIZE - width) / 2, (PROFILE_IMAGE_SIZE - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
