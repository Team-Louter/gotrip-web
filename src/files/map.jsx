import mapImg from '../images/mapImg.png';
import mappinIcon from '../icons/mappinIcon.png';
import addMappin from '../icons/addMappin.png';
import editIcon from '../icons/editIcon.png';
import deleteIcon from '../icons/deleteIcon.png';
import '../styles/map.css';

function Map() {
  return (
    <div className="map-container">
      <div className='map-box'>
        <img src={mapImg} alt="map-img" className="map-image" />
        {/* 지도에서 찍은 위치 표시 */}
        <div className="map-contents-box">

          <div className="map-content">
            <img src={mappinIcon} alt="mappin-icon" className="mappin-icon" />
            <div className="map-elements-box">
              <span className="map-content-text">일본 전문라멘집 37동 61거리 42-7</span>
              <button className="mappin-delete-button">삭제</button>
            </div>
          </div>

          <div className="map-content">
            <img src={mappinIcon} alt="mappin-icon" className="mappin-icon" />
            <div className="map-elements-box">
              <span className="map-content-text">인도 커리동산 23동 12거리 33-1</span>
              <button className="mappin-delete-button">삭제</button>
            </div>
          </div>

          <img src={addMappin} alt="add-mappin" className="add-mappin-icon" />

        </div>
      </div>
      {/* 미리 설정한 스케줄 조회 */}
      <div className="map-schedule-container">
        <div className="schedule-title-box">
          <span className="schedule-title">MY<br></br> SCHEDULE</span>
          <button className="schedule-add-button">추가</button>
        </div>
        <span className="schedule-date">1일차</span>
        <div className="schedule-content-container">

          <div className="schedule-content-box">
            <span className="schedule-content">07 : 15 공항 도착</span>
            <div className="schedule-icons-box">
              <img src={editIcon} alt="edit-icon" className="schedule-edit-icon schedule-icon" />
              <img src={deleteIcon} alt="delete-icon" className="schedule-delete-icon schedule-icon" />
            </div>
          </div>

          <div className="schedule-content-box">
            <span className="schedule-content">09 : 00 식사 후 출국</span>
            <div className="schedule-icons-box">
              <img src={editIcon} alt="edit-icon" className="schedule-edit-icon schedule-icon" />
              <img src={deleteIcon} alt="delete-icon" className="schedule-delete-icon schedule-icon" />
            </div>
          </div>

          <div className="schedule-content-box">
            <span className="schedule-content">12 : 00 도착 후 오사카에서 라멘</span>
            <div className="schedule-icons-box">
              <img src={editIcon} alt="edit-icon" className="schedule-edit-icon schedule-icon" />
              <img src={deleteIcon} alt="delete-icon" className="schedule-delete-icon schedule-icon" />
            </div>
          </div>

          <div className="schedule-content-box">
            <span className="schedule-content">13 : 00 식사 후 쇼핑</span>
            <div className="schedule-icons-box">
              <img src={editIcon} alt="edit-icon" className="schedule-edit-icon schedule-icon" />
              <img src={deleteIcon} alt="delete-icon" className="schedule-delete-icon schedule-icon" />
            </div>
          </div>

          <div className="schedule-content-box">
            <span className="schedule-content">16 : 30  교토로 버스 타고 출발</span>
            <div className="schedule-icons-box">
              <img src={editIcon} alt="edit-icon" className="schedule-edit-icon schedule-icon" />
              <img src={deleteIcon} alt="delete-icon" className="schedule-delete-icon schedule-icon" />
            </div>
          </div>

          <div className="schedule-content-box">
            <span className="schedule-content">17 : 10  도착 후 관광지 구경</span>
            <div className="schedule-icons-box">
              <img src={editIcon} alt="edit-icon" className="schedule-edit-icon schedule-icon" />
              <img src={deleteIcon} alt="delete-icon" className="schedule-delete-icon schedule-icon" />
            </div>
          </div>

          <div className="schedule-content-box">
            <span className="schedule-content">19 : 00  식사후 숙소로 이동</span>
            <div className="schedule-icons-box">
              <img src={editIcon} alt="edit-icon" className="schedule-edit-icon schedule-icon" />
              <img src={deleteIcon} alt="delete-icon" className="schedule-delete-icon schedule-icon" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
export default Map;