import { NavLink } from 'react-router-dom';
import profileImg from '../images/profile.jpg';
import homeIcon from '../icons/homeIcon.png';
import chatIcon from '../icons/chatIcon.png';
import mapIcon from '../icons/mapIcon.png';
import projectIcon from '../icons/projectIcon.png';
import memoIcon from '../icons/memoIcon.png';
import calenderIcon from '../icons/calenderIcon.png';
import recieptIcon from '../icons/recieptIcon.png';
import settingIcon from '../icons/settingIcon.png';
import '../styles/sideBar.css';

function SideBar() {
  return (
    <div className="sidebar-container">
      <div className="profile-container">
        <img src={profileImg} alt="profile-img" className="profile-img" />
        <span className="user-name">사용자 이름</span>
      </div>
      <div className="menu-container">
        <NavLink to="/main">
          <div className="sidebar-item">
            <img src={homeIcon} alt="home-icon" className="sidebar-icon" />
            Home
          </div>
        </NavLink>
        <NavLink to="/map">
          <div className="sidebar-item">
            <img src={mapIcon} alt="map-icon" className="sidebar-icon" />
            Map
          </div>
        </NavLink>
        <NavLink to="/chat/:roomId  ">
          <div className="sidebar-item">
            <img src={chatIcon} alt="chat-icon" className="sidebar-icon" />
            Chat
          </div>
        </NavLink>
        <NavLink to="/memo">
          <div className="sidebar-item">
            <img src={memoIcon} alt="memo-icon" className="sidebar-icon" />
            Memo
          </div>
        </NavLink>
        <NavLink to="/calendar">
          <div className="sidebar-item">
            <img
              src={calenderIcon}
              alt="calender-icon"
              className="sidebar-icon"
            />
            Calender
          </div>
        </ NavLink>
        <NavLink to="/pay">
          <div className="sidebar-item">
            <img
              src={recieptIcon}
              alt="reciept-icon"
              className="sidebar-icon"
            />
            Reciept
          </div>
        </NavLink>
      </div>
    </div>
  );
}
export default SideBar;
