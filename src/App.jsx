import { getToken } from './api/session';
import { fetchProfile } from './services/profileApi';
import { useEffect, useState } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import SideBar from './components/sideBar';
import MainPage from './files/mainPage';
import Map from './files/map';
import MapAPI from './files/mapAPI';
import Calender from './files/calender';
import ChatHomeAPI from './files/chatHomeAPI';
import ChatRoom from './files/chatRoom';
import IsLogin from './files/isLogin';
import MemoPage from './files/memoPage';
import FriendsPage from './files/friendsPage';
import PayForm from './files/payForm';
import SettingsPage from './files/settingsPage';
import SignUp from './files/signUp';
import SignUp2 from './files/signUp2';
import SignUpTerms from './files/signUpTerms';
import './App.css';

function AuthLayout() {
  return (
    <div className="layout">
      <Outlet />
    </div>
  );
}

function MainLayout() {

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!getToken()) return;
    const controller = new AbortController();
    fetchProfile(controller.signal).then((data) => {
      if (!controller.signal.aborted) setProfile((current) => current ?? data);
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="layout">
      <SideBar profile={profile} />
      <Outlet context={{ profile, setProfile }} />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/islogin" replace />} />

      {/* 로그인 → 회원가입 → step2 → 약관 → 다시 로그인 */}
      <Route element={<AuthLayout />}>
        <Route path="/islogin" element={<IsLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signup/step2" element={<SignUp2 />} />
        <Route path="/signup/terms" element={<SignUpTerms />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/main" element={<MainPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/map" element={<Map />} />
        <Route path="/map-api" element={<MapAPI />} />
        <Route path="/calendar" element={<Calender />} />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="/chat-api" element={<ChatHomeAPI />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/memo" element={<MemoPage />} />
        <Route path="/pay" element={<PayForm />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/islogin" replace />} />
    </Routes>
  );
}

export default App;
