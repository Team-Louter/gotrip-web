import { useEffect, useRef, useState } from 'react';
import mapImg from '../images/mapImg.png';
import mappinIcon from '../icons/mappinIcon.png';
import addMappin from '../icons/addMappin.png';
import { useNavigate } from 'react-router-dom';
import '../styles/map.css';
import SchedulePanel from '../components/SchedulePanel';

function Map() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([
    { id: 1, text: '일본 전문라멘집 37동 61거리 42-7' },
    { id: 2, text: '인도 커리동산 23동 12거리 33-1' },
  ]);


  const [isPlaceAddOpen, setIsPlaceAddOpen] = useState(false);
  const [address, setAddress] = useState('');
  const addressInputRef = useRef(null);


  useEffect(() => {
    if (!isPlaceAddOpen) return;

    addressInputRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsPlaceAddOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isPlaceAddOpen]);

  const handleAddPlace = () => {
    const value = address.trim();
    if (!value) {
      addressInputRef.current?.focus();
      return;
    }
    setPlaces((prev) => [...prev, { id: Date.now(), text: value }]);
    setIsPlaceAddOpen(false);
  };

  const handleDeletePlace = (id) => {
    setPlaces((prev) => prev.filter((place) => place.id !== id));
  };

  return (
    <div className="map-container">
      <div className="map-box">
        <img
          src={mapImg}
          alt="map-img"
          className="map-image"
          onClick={() => navigate('/map-api')}
          style={{ cursor: 'pointer' }}
        />

        <div className="map-contents-box">

          <div className="map-places-list">
            {places.map((place) => (
              <div className="map-content" key={place.id}>
                <img
                  src={mappinIcon}
                  alt="mappin-icon"
                  className="mappin-icon"
                />
                <div className="map-elements-box">
                  <span className="map-content-text">{place.text}</span>
                  <button
                    className="mappin-delete-button"
                    onClick={() => handleDeletePlace(place.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>


          <img
            src={addMappin}
            alt="add-mappin"
            className="add-mappin-icon"
            onClick={() => { setAddress(''); setIsPlaceAddOpen(true); }}
          />
        </div>
      </div>

      <SchedulePanel />

      {isPlaceAddOpen && (
        <div
          className="place-add-backdrop"
          onMouseDown={() => setIsPlaceAddOpen(false)}
        >
          <div
            className="place-add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="place-add-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="place-add-title" className="place-add-title">
              장소추가
            </h2>
            <input
              ref={addressInputRef}
              className="place-add-input"
              type="text"
              placeholder="주소 입력"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  handleAddPlace();
                }
              }}
            />
            <div className="place-add-actions">
              <button
                type="button"
                className="place-add-btn place-add-cancel"
                onClick={() => setIsPlaceAddOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="place-add-btn place-add-confirm"
                onClick={handleAddPlace}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Map;
