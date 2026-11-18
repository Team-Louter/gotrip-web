import '../styles/skeleton.css';

export function SkeletonBlock({ className = '', circle = false }) {
  return <span aria-hidden="true" className={`skeleton-block${circle ? ' is-circle' : ''}${className ? ` ${className}` : ''}`} />;
}

export function SkeletonRows({ count = 4, className = '', avatar = false }) {
  return (
    <div className={`skeleton-rows${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-row" key={index}>
          {avatar && <SkeletonBlock circle className="skeleton-avatar" />}
          <div className="skeleton-row-copy">
            <SkeletonBlock className="skeleton-line skeleton-line-main" />
            <SkeletonBlock className="skeleton-line skeleton-line-sub" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonFriendRows({ count = 4, action = 'button', className = '' }) {
  return (
    <div className={`skeleton-friend-list${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-friend-row" key={index}>
          <SkeletonBlock circle className="skeleton-friend-avatar" />
          <div className="skeleton-friend-copy">
            <SkeletonBlock className="skeleton-friend-name" />
            <SkeletonBlock className="skeleton-friend-id" />
          </div>
          {action === 'button' && <SkeletonBlock className="skeleton-friend-action" />}
          {action === 'check' && <SkeletonBlock className="skeleton-friend-check" />}
        </div>
      ))}
    </div>
  );
}

export function SkeletonGroupRows({ count = 4, className = '' }) {
  return (
    <div className={`skeleton-group-list${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-group-row" key={index}>
          <SkeletonBlock className="skeleton-group-name" />
          <SkeletonBlock className="skeleton-group-count" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel({ label = '화면을 불러오는 중입니다.', className = '', children }) {
  return (
    <div className={`skeleton-panel${className ? ` ${className}` : ''}`} role="status" aria-label={label} aria-busy="true">
      <span className="skeleton-visually-hidden">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
