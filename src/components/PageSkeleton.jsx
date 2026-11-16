import { useLocation } from 'react-router-dom';
import { Skeleton, SkeletonConversation, SkeletonEditor, SkeletonList, SkeletonMap, SkeletonProfile, SkeletonRegion } from './Skeleton';

function PanelSkeleton({ children }) {
  return <div className="skeleton-panel"><Skeleton className="skeleton-title" />{children || <SkeletonList variant="memo" count={3} />}</div>;
}

export default function PageSkeleton() {
  const { pathname } = useLocation();
  const page = pathname.split('/')[1];

  if (page === 'login' || page === 'registration') {
    return (
      <SkeletonRegion label={page === 'login' ? '로그인 화면을 불러오는 중이에요.' : '회원가입 화면을 불러오는 중이에요.'} className={`skeleton-page skeleton-auth skeleton-auth--${page}${pathname.endsWith('/terms') ? ' skeleton-auth--terms' : ''}`}>
        <div className="skeleton-auth-form">
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line skeleton-line--short" />
          {Array.from({ length: page === 'login' ? 2 : 3 }, (_, index) => <Skeleton key={index} className="skeleton-input" />)}
          <Skeleton className="skeleton-input" />
        </div>
        <Skeleton className="skeleton-auth-image" />
      </SkeletonRegion>
    );
  }

  if (page === 'chat') {
    return (
      <div className="skeleton-page skeleton-chat-page">
        <div className="skeleton-chat-list"><Skeleton className="skeleton-title" /><Skeleton className="skeleton-input" /><SkeletonList variant="chat" label="채팅방을 불러오는 중이에요." /></div>
        <SkeletonConversation />
      </div>
    );
  }

  if (page === 'memo') {
    return <div className="skeleton-page skeleton-memo-page"><SkeletonEditor /><PanelSkeleton><Skeleton className="skeleton-input" /><SkeletonList variant="memo" /><Skeleton className="skeleton-summary" /></PanelSkeleton></div>;
  }

  if (page === 'places') {
    return <div className="skeleton-page skeleton-places-page map-api-page"><SkeletonMap /><PanelSkeleton /></div>;
  }

  if (page === 'map') {
    return <div className="skeleton-page skeleton-columns skeleton-map-page"><div className="skeleton-map-column"><SkeletonMap /><PanelSkeleton /></div><PanelSkeleton /></div>;
  }

  if (page === 'calendar') {
    return (
      <div className="skeleton-page skeleton-columns skeleton-calendar-page">
        <PanelSkeleton><SkeletonRegion label="캘린더를 불러오는 중이에요." className="skeleton-calendar-grid">{Array.from({ length: 42 }, (_, index) => <Skeleton key={index} />)}</SkeletonRegion></PanelSkeleton>
        <PanelSkeleton />
      </div>
    );
  }

  if (page === 'friends') {
    return <div className="skeleton-page skeleton-columns skeleton-friends-page"><PanelSkeleton><Skeleton className="skeleton-input" /><SkeletonList label="친구 목록을 불러오는 중이에요." /></PanelSkeleton><PanelSkeleton><SkeletonList label="친구 요청을 불러오는 중이에요." count={3} /></PanelSkeleton></div>;
  }

  if (page === 'settings') {
    return <div className="skeleton-page skeleton-settings-page settings-page"><PanelSkeleton><SkeletonProfile /></PanelSkeleton><PanelSkeleton><SkeletonList variant="memo" count={2} label="계정 정보를 불러오는 중이에요." /></PanelSkeleton></div>;
  }

  if (page === 'payment') {
    return <div className="skeleton-page skeleton-payment-page pay-page"><PanelSkeleton><Skeleton className="skeleton-total" /><Skeleton className="skeleton-input" /><SkeletonList variant="memo" label="정산 화면을 불러오는 중이에요." /></PanelSkeleton></div>;
  }

  return <SkeletonRegion className="skeleton-page skeleton-home-page"><Skeleton className="skeleton-title" /><Skeleton className="skeleton-input" /></SkeletonRegion>;
}
