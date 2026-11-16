import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { profileImageSource } from '../services/profileApi';
import profileImg from '../images/profile.jpg';
import homeIcon from '../icons/homeIcon.png';
import chatIcon from '../icons/chatIcon.png';
import mapIcon from '../icons/mapIcon.png';
import memoIcon from '../icons/memoIcon.png';
import calenderIcon from '../icons/calenderIcon.png';
import recieptIcon from '../icons/recieptIcon.png';
import { getLoginId, getToken } from '../api/session.js';
import { memberApi } from '../services/memberApi.js';
import { Skeleton, SkeletonImage, SkeletonRegion } from './Skeleton';
import '../styles/sideBar.css';

function SideBar({ profile, profileLoading }) {
  const { pathname } = useLocation();
  const loginId = getLoginId();
  const [displayName, setDisplayName] = useState(loginId || '사용자');
  const [nameLoading, setNameLoading] = useState(() => Boolean(getToken() && loginId));
  const isCurrent = (...paths) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    setDisplayName(loginId || '사용자');
    setNameLoading(Boolean(getToken() && loginId));
    if (!getToken() || !loginId) return undefined;

    const controller = new AbortController();
    memberApi.getMembers({ excludeSelf: false, signal: controller.signal }).then((members) => {
      const currentMember = members.find((member) => member.loginId === loginId);
      if (!controller.signal.aborted && currentMember?.name) setDisplayName(currentMember.name);
    }).catch(() => {}).finally(() => {
      if (!controller.signal.aborted) setNameLoading(false);
    });

    return () => controller.abort();
  }, [loginId]);

  return (
    <div className="sidebar-container">
      {profileLoading || (nameLoading && !profile?.nickname) ? <SkeletonRegion className="profile-container" label="프로필을 불러오는 중이에요.">
        <Skeleton className="profile-img" /><Skeleton className="skeleton-sidebar-name user-name" />
      </SkeletonRegion> : <div className="profile-container">
        <SkeletonImage src={profileImageSource(profile?.profileImageUrl) || profileImg} alt="프로필 사진" className="profile-img" />
        <span className="user-name">{profile?.nickname || displayName}</span>
      </div>}
      <nav className="menu-container" aria-label="사이드 메뉴">
        <Link to="/home" className="sidebar-link" aria-current={isCurrent('/home') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={homeIcon} alt="홈" className="sidebar-icon" />
            홈
          </div>
        </Link>
        <Link to="/map" className="sidebar-link" aria-current={isCurrent('/map', '/places') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={mapIcon} alt="지도" className="sidebar-icon" />
            지도
          </div>
        </Link>
        <Link to="/chat" className="sidebar-link" aria-current={isCurrent('/chat') ? 'page' : undefined}>
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
        <Link to="/payment" className="sidebar-link" aria-current={isCurrent('/payment') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img
              src={recieptIcon}
              alt="영수증"
              className="sidebar-icon"
            />
            영수증
          </div>
        </Link>
        <Link to="/settings" className="sidebar-link" aria-current={isCurrent('/settings') ? 'page' : undefined}>
          <div className="sidebar-item">
            <span className="sidebar-icon sidebar-settings-icon" aria-hidden="true">⚙</span>
            설정
          </div>
        </Link>
      </nav>
    </div>
  );
}
export default SideBar;
