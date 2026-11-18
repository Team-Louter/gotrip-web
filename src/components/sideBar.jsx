import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DEFAULT_PROFILE_IMAGE, profileImageSource } from '../services/profileApi';
import homeIcon from '../icons/homeIcon.png';
import chatIcon from '../icons/chatIcon.png';
import mapIcon from '../icons/mapIcon.png';
import memoIcon from '../icons/memoIcon.png';
import calenderIcon from '../icons/calenderIcon.png';
import recieptIcon from '../icons/recieptIcon.png';
import settingIcon from '../icons/settingIcon.png';
import { getLoginId, getToken } from '../api/session.js';
import { memberApi } from '../services/memberApi.js';
import { showErrorToast } from './AppToasts';
import { SkeletonBlock } from './Skeleton';
import '../styles/sideBar.css';

function SideBar({ profile, profileLoading = false }) {
  const { pathname } = useLocation();
  const loginId = getLoginId();
  const [displayName, setDisplayName] = useState(loginId || '사용자');
  const isCurrent = (...paths) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const handleFeatureNavigation = () => {
    if (!getToken()) showErrorToast('로그인이 필요합니다.');
  };

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
      <Link to="/settings" className="sidebar-profile-link" aria-label="프로필 설정으로 이동" aria-current={isCurrent('/settings') ? 'page' : undefined} onClick={handleFeatureNavigation}>
        <div className="profile-container">
          {profileLoading ? <><SkeletonBlock circle className="sidebar-profile-skeleton" /><SkeletonBlock className="sidebar-name-skeleton" /></> : <>
            <img src={profileImageSource(profile?.profileImageUrl) || DEFAULT_PROFILE_IMAGE} alt="" className="profile-img" />
            <span className="user-name">{profile?.nickname || displayName}</span>
          </>}
        </div>
      </Link>
      <nav className="menu-container" aria-label="사이드 메뉴">
        <Link to="/home" className="sidebar-link" aria-current={isCurrent('/home') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <img src={homeIcon} alt="홈" className="sidebar-icon" />
            홈
          </div>
        </Link>
        <Link to="/map" className="sidebar-link" aria-current={isCurrent('/map', '/places') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <img src={mapIcon} alt="지도" className="sidebar-icon" />
            지도
          </div>
        </Link>
        <Link to="/chat" className="sidebar-link" aria-current={isCurrent('/chat') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <img src={chatIcon} alt="채팅" className="sidebar-icon" />
            채팅
          </div>
        </Link>
        <Link to="/friends" className="sidebar-link" aria-current={isCurrent('/friends') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <svg className="sidebar-icon" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="9" r="4" />
              <path d="M3.5 25v-2.5a7.5 7.5 0 0 1 15 0V25z" />
              <path d="M20 5.5a4 4 0 0 1 0 7.3M22 17a6 6 0 0 1 4.5 5.8V25h-5" />
            </svg>
            친구
          </div>
        </Link>
        <Link to="/memo" className="sidebar-link" aria-current={isCurrent('/memo') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <img src={memoIcon} alt="메모" className="sidebar-icon" />
            메모
          </div>
        </Link>
        <Link to="/calendar" className="sidebar-link" aria-current={isCurrent('/calendar') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <img
              src={calenderIcon}
              alt="캘린더"
              className="sidebar-icon"
            />
            캘린더
          </div>
        </Link>
        <Link to="/payment" className="sidebar-link" aria-current={isCurrent('/payment') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <img
              src={recieptIcon}
              alt="영수증"
              className="sidebar-icon"
            />
            영수증
          </div>
        </Link>
        <Link to="/settings" className="sidebar-link" aria-current={isCurrent('/settings') ? 'page' : undefined} onClick={handleFeatureNavigation}>
          <div className="sidebar-item">
            <img src={settingIcon} alt="설정" className="sidebar-icon" />
            설정
          </div>
        </Link>
      </nav>
    </div>
  );
}
export default SideBar;
