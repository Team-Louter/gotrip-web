import { Link, useLocation } from 'react-router-dom';
import profileImg from '../images/profile.jpg';
import homeIcon from '../icons/homeIcon.png';
import chatIcon from '../icons/chatIcon.png';
import mapIcon from '../icons/mapIcon.png';
import memoIcon from '../icons/memoIcon.png';
import calenderIcon from '../icons/calenderIcon.png';
import recieptIcon from '../icons/recieptIcon.png';
import '../styles/sideBar.css';

function SideBar() {
  const { pathname } = useLocation();
  const isCurrent = (...paths) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return (
    <div className="sidebar-container">
      <div className="profile-container">
        <img src={profileImg} alt="profile-img" className="profile-img" />
        <span className="user-name">사용자 이름</span>
      </div>
      <nav className="menu-container" aria-label="사이드 메뉴">
        <Link to="/main" className="sidebar-link" aria-current={isCurrent('/main') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={homeIcon} alt="home-icon" className="sidebar-icon" />
            Home
          </div>
        </Link>
        <Link to="/map" className="sidebar-link" aria-current={isCurrent('/map', '/map-api') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={mapIcon} alt="map-icon" className="sidebar-icon" />
            Map
          </div>
        </Link>
        <Link to="/chat" className="sidebar-link" aria-current={isCurrent('/chat', '/chat-api') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={chatIcon} alt="chat-icon" className="sidebar-icon" />
            Chat
          </div>
        </Link>
        <Link to="/memo" className="sidebar-link" aria-current={isCurrent('/memo') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img src={memoIcon} alt="memo-icon" className="sidebar-icon" />
            Memo
          </div>
        </Link>
        <Link to="/calendar" className="sidebar-link" aria-current={isCurrent('/calendar') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img
              src={calenderIcon}
              alt="calender-icon"
              className="sidebar-icon"
            />
            Calender
          </div>
        </Link>
        <Link to="/pay" className="sidebar-link" aria-current={isCurrent('/pay') ? 'page' : undefined}>
          <div className="sidebar-item">
            <img
              src={recieptIcon}
              alt="reciept-icon"
              className="sidebar-icon"
            />
            Reciept
          </div>
        </Link>
      </nav>
    </div>
  );
}
export default SideBar;
