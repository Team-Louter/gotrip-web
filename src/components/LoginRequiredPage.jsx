import { Link, useLocation } from 'react-router-dom';
import '../styles/loginRequired.css';

const featureTitles = [
  ['/home', '홈'],
  ['/friends', '친구'],
  ['/map', '지도'],
  ['/places', '주변 장소'],
  ['/calendar', '캘린더'],
  ['/chat', '채팅'],
  ['/memo', '메모'],
  ['/payment', '영수증'],
  ['/settings', '설정'],
];

export default function LoginRequiredPage() {
  const { pathname } = useLocation();
  const title = featureTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1] ?? '여행 기능';

  return (
    <main className="login-required-page">
      <h1>{title}</h1>
      <section className="login-required-prompt" aria-label={`${title} 로그인 안내`}>
        <p role="status">로그인 후 이용해 주세요.</p>
        <Link className="login-required-button" to="/login" state={{ from: pathname }}>
          로그인하기
        </Link>
      </section>
    </main>
  );
}
