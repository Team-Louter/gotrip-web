import { Component, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import PageSkeleton from './PageSkeleton';

class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <main className="page-load-error" role="alert"><p>화면을 불러오지 못했어요.</p><button type="button" onClick={() => window.location.reload()}>다시 시도</button></main>;
    }
    return this.props.children;
  }
}

export default function PageContent({ children }) {
  const { pathname } = useLocation();
  const routeKey = pathname.startsWith('/registration') ? pathname : pathname.split('/')[1];
  return <PageErrorBoundary key={routeKey}><Suspense fallback={<PageSkeleton />}>{children}</Suspense></PageErrorBoundary>;
}
