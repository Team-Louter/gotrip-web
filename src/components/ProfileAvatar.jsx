import { DEFAULT_PROFILE_IMAGE, profileImageSource } from '../services/profileApi.js';

export default function ProfileAvatar({ imageUrl, className }) {
  return (
    <img
      className={className}
      src={profileImageSource(imageUrl) || DEFAULT_PROFILE_IMAGE}
      alt=""
      aria-hidden="true"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
      }}
    />
  );
}
