import '../styles/mapAPI.css';
import mappinIcon from '../icons/mappinIcon.png';
import editIcon from '../icons/editIcon.png';
import deleteIcon from '../icons/deleteIcon.png';
import mappin from '../icons/mappin.png';

function MapAPI() {
  return (
    <div className='mini-map-background'>
      <div className="mini-map-schedule-container">
        <div className="mini-schedule-box">
          <div className="mini-schedule-title-box">
            <span className="mini-schedule-title">
              MY
              <br />
              SCHEDULE
            </span>
          </div>

          <span className="mini-schedule-date">1일차</span>

          <div className="mini-schedule-line"></div>

          <div className="mini-schedule-content-container">
            <div className="mini-schedule-content-box">
              <span className="mini-schedule-content">07 : 15 공항 도착</span>
            </div>

            <div className="mini-schedule-content-box">
              <span className="mini-schedule-content">
                09 : 00 식사 후 출국
              </span>
            </div>

            <div className="mini-schedule-content-box">
              <span className="mini-schedule-content">
                12 : 00 도착 후 라멘 식사
              </span>
            </div>

            <div className="mini-schedule-content-box">
              <span className="mini-schedule-content">
                13 : 00 식사 후 쇼핑
              </span>
            </div>

            <div className="mini-schedule-content-box">
              <span className="mini-schedule-content">
                16 : 30 교토로 버스 타고 출발
              </span>
            </div>

            <div className="mini-schedule-content-box">
              <span className="mini-schedule-content">
                17 : 10 도착 후 관광지 구경
              </span>
            </div>

            <div className="mini-schedule-content-box">
              <span className="mini-schedule-content">
                19 : 00 식사 후 숙소로 이동
              </span>
            </div>
          </div>
        </div>
      </div>
      <img src={mappin} alt='mappin' className='mappin'/>
    </div>
  );
}
export default MapAPI;
