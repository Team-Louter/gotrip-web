import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import SideBar from './components/sideBar';
import MainPage from './files/mainPage';
import Map from './files/map';
import MapAPI from './files/mapAPI';
import Calender from './files/calender';
import ChatHome from './files/chatHome';
import ChatRoom from './files/chatRoom';
import IsLogin from './files/isLogin';
import MemoPage from './files/memoPage';
import PayForm from './files/payForm';
import SignUp from './files/signUp';
import SignUp2 from './files/signUp2';
import SignUpTerms from './files/signUpTerms';
import './App.css';
import Memo from './files/memoPage';

// 로그인/회원가입처럼 사이드바가 필요 없는 페이지용 레이아웃
function AuthLayout() {
  return (
    <div className="layout">
      <Outlet />
    </div>
  );
}

// 사이드바가 있는 메인 서비스용 레이아웃
function MainLayout() {
  return (
    <div className="layout">
      <SideBar />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* 사이드바 없는 페이지 */}
      <Route element={<AuthLayout />}>
        <Route path="/islogin" element={<IsLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signup/step2" element={<SignUp2 />} />
        <Route path="/signup/terms" element={<SignUpTerms />} />
      </Route>

      {/* 사이드바 있는 페이지 */}
      <Route element={<MainLayout />}>
        <Route path="/main" element={<MainPage />} />
        <Route path="/map" element={<Map />} />
        <Route path="/map-api" element={<MapAPI />} />
        <Route path="/calendar" element={<Calender />} />
        <Route path="/chat" element={<ChatHome />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/memo" element={<MemoPage />} />
        <Route path="/pay" element={<PayForm />} />
      </Route>

    
      <Route path="*" element={<Navigate to="/signup" replace />} /> 
    </Routes>
  );
}

export default App;