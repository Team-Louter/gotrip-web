import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import profileImg from '../images/profile.jpg';
import homeIcon from '../icons/homeIcon.png';
import chatIcon from '../icons/chatIcon.png';
import mapIcon from '../icons/mapIcon.png';
import memoIcon from '../icons/memoIcon.png';
import calenderIcon from '../icons/calenderIcon.png';
import recieptIcon from '../icons/recieptIcon.png';
import { getLoginId, getToken } from '../api/session.js';
import { memberApi } from '../services/memberApi.js';
import '../styles/sideBar.css';

function SideBar() {
  const { pathname } = useLocation();
  const loginId = getLoginId();
  const [displayName, setDisplayName] = useState(loginId || '사용자');
  const isCurrent = (...paths) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    setDisplayName(loginId || '사용자');
    if (!getToken() || !loginId) return undefined;

    const controller = new AbortController();
    memberApi.getMembers({ excludeSelf: false, signal: controller.signal }).then((members) => {
      const currentMember = members.find((member) => member.loginId === loginId);
      if (!controller.signal.aborted && currentMember?.name) setDisplayName(currentMember.name);
    }).catch(() => {});

    return () => controller.abort();
  }, [loginId]);

  return (
    <div className="sidebar-container">
      <div className="profile-container">
        <img src={profileImg} alt="프로필 사진" className="profile-img" />
        <span className="user-name">{displayName}</span>
      </div>
      <nav className="menu-container" aria-label="사이드 메뉴">
        <Link to="/main" className="sidebar-link" aria-current={isCurrent('/main') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={homeIcon} alt="홈" className="sidebar-icon" />
            홈
          </div>
        </Link>
        <Link to="/map" className="sidebar-link" aria-current={isCurrent('/map', '/map-api') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={mapIcon} alt="지도" className="sidebar-icon" />
            지도
          </div>
        </Link>
        <Link to="/chat" className="sidebar-link" aria-current={isCurrent('/chat', '/chat-api') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={chatIcon} alt="채팅" className="sidebar-icon" />
            채팅
          </div>
        </Link>
        <Link to="/friends" className="sidebar-link" aria-current={isCurrent('/friends') ? 'page' : undefined}>
          <div className="sidebar-item">
            <svg className="sidebar-icon" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="9" r="4" />
              <path d="M3.5 25v-2.5a7.5 7.5 0 0 1 15 0V25z" />
              <path d="M20 5.5a4 4 0 0 1 0 7.3M22 17a6 6 0 0 1 4.5 5.8V25h-5" />
            </svg>
            친구
          </div>
        </Link>
        <Link to="/memo" className="sidebar-link" aria-current={isCurrent('/memo') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={memoIcon} alt="메모" className="sidebar-icon" />
            메모
          </div>
        </Link>
        <Link to="/calendar" className="sidebar-link" aria-current={isCurrent('/calendar') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img
              src={calenderIcon}
              alt="캘린더"
              className="sidebar-icon"
            />
            캘린더
          </div>
        </Link>
        <Link to="/pay" className="sidebar-link" aria-current={isCurrent('/pay') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img
              src={recieptIcon}
              alt="영수증"
              className="sidebar-icon"
            />
            영수증
          </div>
        </Link>
      </nav>
    </div>
  );
}
export default SideBar;
