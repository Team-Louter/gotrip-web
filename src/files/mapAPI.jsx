import '../styles/mapAPI.css';
import mappinIcon from '../icons/mappinIcon.png';
import editIcon from '../icons/editIcon.png';
import deleteIcon from '../icons/deleteIcon.png';
import mappin from '../icons/mappin.png';

function MapAPI() {
  return (
    <div className='map-background'>
      <div className="map-schedule-container">
        <div className="schedule-scroll">
          <div className="schedule-title-box">
            <span className="schedule-title">
              MY
              <br />
              SCHEDULE
            </span>

            <button className="schedule-add-button">추가</button>
          </div>

          <span className="schedule-date">1일차</span>

          <div className="schedule-content-container">
            <div className="schedule-content-box">
              <span className="schedule-content">07 : 15 공항 도착</span>

              <div className="schedule-icons-box">
                <img
                  src={editIcon}
                  alt="edit-icon"
                  className="schedule-edit-icon schedule-icon"
                />
                <img
                  src={deleteIcon}
                  alt="delete-icon"
                  className="schedule-delete-icon schedule-icon"
                />
              </div>
            </div>

            <div className="schedule-content-box">
              <span className="schedule-content">09 : 00 식사 후 출국</span>

              <div className="schedule-icons-box">
                <img
                  src={editIcon}
                  alt="edit-icon"
                  className="schedule-edit-icon schedule-icon"
                />
                <img
                  src={deleteIcon}
                  alt="delete-icon"
                  className="schedule-delete-icon schedule-icon"
                />
              </div>
            </div>

            <div className="schedule-content-box">
              <span className="schedule-content">
                12 : 00 도착 후 오사카에서 라멘
              </span>

              <div className="schedule-icons-box">
                <img
                  src={editIcon}
                  alt="edit-icon"
                  className="schedule-edit-icon schedule-icon"
                />
                <img
                  src={deleteIcon}
                  alt="delete-icon"
                  className="schedule-delete-icon schedule-icon"
                />
              </div>
            </div>

            <div className="schedule-content-box">
              <span className="schedule-content">13 : 00 식사 후 쇼핑</span>

              <div className="schedule-icons-box">
                <img
                  src={editIcon}
                  alt="edit-icon"
                  className="schedule-edit-icon schedule-icon"
                />
                <img
                  src={deleteIcon}
                  alt="delete-icon"
                  className="schedule-delete-icon schedule-icon"
                />
              </div>
            </div>

            <div className="schedule-content-box">
              <span className="schedule-content">
                16 : 30 교토로 버스 타고 출발
              </span>

              <div className="schedule-icons-box">
                <img
                  src={editIcon}
                  alt="edit-icon"
                  className="schedule-edit-icon schedule-icon"
                />
                <img
                  src={deleteIcon}
                  alt="delete-icon"
                  className="schedule-delete-icon schedule-icon"
                />
              </div>
            </div>

            <div className="schedule-content-box">
              <span className="schedule-content">
                17 : 10 도착 후 관광지 구경
              </span>

              <div className="schedule-icons-box">
                <img
                  src={editIcon}
                  alt="edit-icon"
                  className="schedule-edit-icon schedule-icon"
                />
                <img
                  src={deleteIcon}
                  alt="delete-icon"
                  className="schedule-delete-icon schedule-icon"
                />
              </div>
            </div>

            <div className="schedule-content-box">
              <span className="schedule-content">
                19 : 00 식사후 숙소로 이동
              </span>

              <div className="schedule-icons-box">
                <img
                  src={editIcon}
                  alt="edit-icon"
                  className="schedule-edit-icon schedule-icon"
                />
                <img
                  src={deleteIcon}
                  alt="delete-icon"
                  className="schedule-delete-icon schedule-icon"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
       <img src={mappin} alt="mappin" className="mappin" />
      </div>
    </div>
  );
}
export default MapAPI;
