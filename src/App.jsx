import { getToken } from './api/session';
import { fetchProfile } from './services/profileApi';
import { lazy, useEffect, useState } from 'react';
import { Routes, Route, Outlet, Navigate, useParams } from 'react-router-dom';
import SideBar from './components/sideBar';
import PageContent from './components/PageContent';
// 기존 전역 스타일의 적용 순서를 페이지 로딩 순서와 무관하게 유지합니다.
import './styles/mainPage.css';
import './styles/map.css';
import './styles/schedule.css';
import './styles/mapAPI.css';
import './styles/calender.css';
import './styles/chatMessages.css';
import './styles/chatHome.css';
import './styles/chatRoom.css';
import './styles/chatRooms.css';
import './styles/login.css';
import './styles/memoPage.css';
import './styles/friendsPage.css';
import './styles/payForm.css';
import './styles/settingsPage.css';
import './styles/signUp.css';
import './styles/signUpTerms.css';
import './App.css';
import './styles/auth.css';

const MainPage = lazy(() => import('./files/mainPage'));
const Map = lazy(() => import('./files/map'));
const MapAPI = lazy(() => import('./files/mapAPI'));
const Calender = lazy(() => import('./files/calender'));
const ChatRoom = lazy(() => import('./files/chatRoom'));
const Login = lazy(() => import('./files/login'));
const MemoPage = lazy(() => import('./files/memoPage'));
const FriendsPage = lazy(() => import('./files/friendsPage'));
const PayForm = lazy(() => import('./files/payForm'));
const SettingsPage = lazy(() => import('./files/settingsPage'));
const SignUp = lazy(() => import('./files/signUp'));
const SignUp2 = lazy(() => import('./files/signUp2'));
const SignUpTerms = lazy(() => import('./files/signUpTerms'));

function AuthLayout() {
  return (
    <div className="layout auth-layout">
      <PageContent><Outlet /></PageContent>
    </div>
  );
}

function LegacyChatRoomRedirect() {
  const { roomId } = useParams();
  if (roomId.startsWith('local-')) return <Navigate to="/chat" replace />;
  return <Navigate to={`/chat/rooms/${encodeURIComponent(roomId)}`} replace />;
}

function MainLayout() {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    const controller = new AbortController();
    fetchProfile(controller.signal).then((data) => {
      if (!controller.signal.aborted) setProfile((current) => current ?? data);
    }).catch(() => {}).finally(() => {
      if (!controller.signal.aborted) setProfileLoading(false);
    });
    return () => controller.abort();
  }, []);

  return (
    <div className="layout">
      <SideBar profile={profile} profileLoading={profileLoading} />
      <PageContent>
        <Outlet context={{ profile, setProfile, profileLoading }} />
      </PageContent>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registration" element={<SignUp />} />
        <Route path="/registration/password" element={<SignUp2 />} />
        <Route path="/registration/terms" element={<SignUpTerms />} />
        <Route path="/islogin" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Navigate to="/registration" replace />} />
        <Route path="/signup/step2" element={<Navigate to="/registration/password" replace />} />
        <Route path="/signup/terms" element={<Navigate to="/registration/terms" replace />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/home" element={<MainPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/map" element={<Map />} />
        <Route path="/places" element={<MapAPI />} />
        <Route path="/calendar" element={<Calender />} />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="/chat/rooms/:roomId" element={<ChatRoom />} />
        <Route path="/memo" element={<MemoPage />} />
        <Route path="/payment" element={<PayForm />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/main" element={<Navigate to="/home" replace />} />
        <Route path="/map-api" element={<Navigate to="/places" replace />} />
        <Route path="/chat-api" element={<Navigate to="/chat" replace />} />
        <Route path="/chat/:roomId" element={<LegacyChatRoomRedirect />} />
        <Route path="/pay" element={<Navigate to="/payment" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
