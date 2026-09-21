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
        <a href="#">
          <div className="sidebar-item">
            <img src={homeIcon} alt="home-icon" className="sidebar-icon" />
            Home
          </div>
        </a>
        <a href="#">
          <div className="sidebar-item">
            <img src={mapIcon} alt="map-icon" className="sidebar-icon" />
            Map
          </div>
        </a>
        <a href="#">
          <div className="sidebar-item">
            <img src={chatIcon} alt="chat-icon" className="sidebar-icon" />
            Chat
          </div>
        </a>
        <a href="#">
          <div className="sidebar-item">
            <img
              src={projectIcon}
              alt="Project-icon"
              className="sidebar-icon"
            />
            Project
          </div>
        </a>
        <a href="#">
          <div className="sidebar-item">
            <img src={memoIcon} alt="memo-icon" className="sidebar-icon" />
            Memo
          </div>
        </a>
        <a href="#">
          <div className="sidebar-item">
            <img
              src={calenderIcon}
              alt="calender-icon"
              className="sidebar-icon"
            />
            Calender
          </div>
        </a>
        <a href="#">
          <div className="sidebar-item">
            <img
              src={recieptIcon}
              alt="reciept-icon"
              className="sidebar-icon"
            />
            Reciept
          </div>
        </a>
        <a href="#">
          <div className="sidebar-item">
            <img
              src={settingIcon}
              alt="setting-icon"
              className="sidebar-icon"
            />
            Setting
          </div>
        </a>
      </div>
    </div>
  );
}
export default SideBar;
