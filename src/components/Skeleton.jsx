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

export function SkeletonPanel({ label = '화면을 불러오는 중입니다.', className = '', children }) {
  return (
    <div className={`skeleton-panel${className ? ` ${className}` : ''}`} role="status" aria-label={label} aria-busy="true">
      <span className="skeleton-visually-hidden">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
