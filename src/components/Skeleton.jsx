import { useEffect, useRef, useState } from 'react';
import '../styles/skeleton.css';

export function Skeleton({ className = '' }) {
  return <span className={`skeleton-block ${className}`} aria-hidden="true" />;
}

export function SkeletonImage({ src, srcSet, alt, className = '', ...props }) {
  const imageRef = useRef(null);
  const source = `${src} ${srcSet || ''}`;
  const [readySource, setReadySource] = useState(null);
  const loading = readySource !== source;

  useEffect(() => {
    if (imageRef.current?.complete) setReadySource(source);
  }, [source]);

  return (
    <span className={`skeleton-image ${className}`} data-loading={loading} aria-busy={loading}>
      {loading && <Skeleton />}
      <img {...props} ref={imageRef} src={src} srcSet={srcSet} alt={alt} className="skeleton-image-content"
        onLoad={() => setReadySource(source)} onError={() => setReadySource(source)} />
    </span>
  );
}

export function SkeletonRegion({ label = '화면을 불러오는 중이에요.', className = '', children }) {
  return (
    <div className={`skeleton-region ${className}`} role="status" aria-label={label} aria-busy="true">
      <span className="skeleton-sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonList({ count = 4, variant = 'friends', label = '목록을 불러오는 중이에요.' }) {
  return (
    <SkeletonRegion label={label} className={`skeleton-list skeleton-list--${variant}`}>
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-row" key={index} aria-hidden="true">
          {variant !== 'memo' && <Skeleton className="skeleton-avatar" />}
          <div className="skeleton-lines">
            <Skeleton className="skeleton-line skeleton-line--short" />
            <Skeleton className="skeleton-line" />
          </div>
          {variant === 'friends' && <Skeleton className="skeleton-action" />}
        </div>
      ))}
    </SkeletonRegion>
  );
}

export function SkeletonEditor({ label = '메모를 불러오는 중이에요.' }) {
  return (
    <SkeletonRegion label={label} className="skeleton-editor">
      <Skeleton className="skeleton-title" />
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} className={`skeleton-line${index % 3 === 2 ? ' skeleton-line--short' : ''}`} />
      ))}
    </SkeletonRegion>
  );
}

export function SkeletonMap() {
  return <SkeletonRegion label="지도를 불러오는 중이에요." className="skeleton-map"><Skeleton /></SkeletonRegion>;
}

export function SkeletonMessages({ count = 4 }) {
  return (
    <SkeletonRegion label="대화를 불러오는 중이에요." className="skeleton-messages">
      {Array.from({ length: count }, (_, index) => (
        <div className={`skeleton-message${index % 2 ? ' skeleton-message--mine' : ''}`} key={index} aria-hidden="true">
          {index % 2 === 0 && <Skeleton className="skeleton-avatar" />}
          <Skeleton className="skeleton-bubble" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

export function SkeletonConversation() {
  return (
    <div className="skeleton-conversation">
      <SkeletonRegion label="채팅방을 불러오는 중이에요." className="skeleton-row skeleton-room-header">
        <Skeleton className="skeleton-avatar" />
        <div className="skeleton-lines"><Skeleton className="skeleton-title" /><Skeleton className="skeleton-line skeleton-line--short" /></div>
      </SkeletonRegion>
      <SkeletonMessages />
      <Skeleton className="skeleton-input skeleton-composer" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <SkeletonRegion label="프로필을 불러오는 중이에요." className="skeleton-profile">
      <Skeleton className="skeleton-avatar" />
      <Skeleton className="skeleton-line skeleton-line--short" />
      <Skeleton className="skeleton-input" />
      <Skeleton className="skeleton-action" />
    </SkeletonRegion>
  );
}
