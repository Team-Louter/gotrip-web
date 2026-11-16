import { getToken } from './api/session';
import { fetchProfile } from './services/profileApi';
import { useEffect, useState } from 'react';
import { Routes, Route, Outlet, Navigate, useParams } from 'react-router-dom';
import AppToasts from './components/AppToasts';
import SideBar from './components/sideBar';
import MainPage from './files/mainPage';
import Map from './files/map';
import MapAPI from './files/mapAPI';
import Calender from './files/calender';
import ChatRoom from './files/chatRoom';
import Login from './files/login';
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

function LegacyChatRoomRedirect() {
  const { roomId } = useParams();
  if (roomId.startsWith('local-')) return <Navigate to="/chat" replace />;
  return <Navigate to={`/chat/rooms/${encodeURIComponent(roomId)}`} replace />;
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
    <>
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
      <AppToasts />
    </>
  );
}

export default App;
