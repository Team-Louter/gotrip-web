import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mapImg from '../images/mapImg.png';
import mappinIcon from '../icons/mappinIcon.png';
import addMappin from '../icons/addMappin.png';
import { getToken } from '../api/session';
import { placeStore } from '../data/placeStore';
import { tripApi } from '../services/tripApi';
import '../styles/map.css';
import SchedulePanel from '../components/SchedulePanel';

function Map() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState(() => placeStore.read());
  const [isPlaceAddOpen, setIsPlaceAddOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const addressInputRef = useRef(null);
  const operationBusy = useRef(false);

  useEffect(() => {
    if (!isPlaceAddOpen) return;
    addressInputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => { if (event.key === 'Escape' && !operationBusy.current) setIsPlaceAddOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [isPlaceAddOpen]);

  function commitPlaces(next) {
    setPlaces(next);
    setStorageError(!placeStore.save(next));
  }

  async function handleAddPlace(event) {
    event.preventDefault();
    if (operationBusy.current) return;
    operationBusy.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const place = await tripApi.addPlace(address);
      commitPlaces([...places, place]);
      setAddress(''); setIsPlaceAddOpen(false);
      setNotice('장소가 서버에 추가되었습니다.');
    } catch (reason) { setError(reason.message); }
    finally { operationBusy.current = false; setBusy(false); }
  }

  async function handleDeletePlace(id) {
    if (operationBusy.current) return;
    operationBusy.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await tripApi.deletePlace(id);
      commitPlaces(places.filter((place) => place.serverId !== String(id)));
      setNotice('장소가 서버에서 삭제되었습니다.');
    } catch (reason) { setError(reason.message); }
    finally { operationBusy.current = false; setBusy(false); }
  }

  function openAddPlace() { if (!operationBusy.current) { setAddress(''); setError(''); setIsPlaceAddOpen(true); } }

  return (
    <div className="map-container">
      <div className="map-box">
        <button type="button" className="map-preview-button" aria-label="지도 API 열기" onClick={() => navigate('/map-api')}><img src={mapImg} alt="지도 미리보기" className="map-image" /></button>
        <div className="map-contents-box">
          <div className="map-places-list" aria-label="추가한 장소">
            {places.length === 0 && <p className="map-api-note map-places-empty">아직 추가한 장소가 없어요.</p>}
            {places.map((place) => <div className="map-content" key={place.id}>
              <img src={mappinIcon} alt="" className="mappin-icon" />
              <div className="map-elements-box"><span className="map-content-text">{place.address}</span>
                {place.serverId ? <button type="button" className="mappin-delete-button" disabled={busy} aria-label={`${place.address} 삭제`} onClick={() => handleDeletePlace(place.serverId)}>삭제</button>
                  : <button type="button" className="mappin-delete-button" disabled={busy} aria-label={`${place.address} 목록에서 숨기기`} onClick={() => commitPlaces(places.filter((item) => item.id !== place.id))}>숨기기</button>}
              </div>
            </div>)}
          </div>
          <button type="button" className="map-add-place" aria-label="장소 추가" disabled={busy} onClick={openAddPlace}><img src={addMappin} alt="" className="add-mappin-icon" /></button>
        </div>
        {!isPlaceAddOpen && error && <div className="map-api-error" role="alert">{error}{!getToken() && <> <Link to="/islogin" state={{ from: '/map' }}>로그인하기</Link></>}</div>}
        <p className="map-api-notice" role="status">{notice}</p>
        {storageError && <p className="map-api-error" role="status">서버 요청은 완료되었지만 브라우저에 목록을 보관하지 못했어요. 새로고침하면 이 목록이 사라질 수 있습니다.</p>}
      </div>
      <SchedulePanel />
      {isPlaceAddOpen && <div className="place-add-backdrop" onMouseDown={() => { if (!operationBusy.current) setIsPlaceAddOpen(false); }}>
        <form className="place-add-modal" role="dialog" aria-modal="true" aria-labelledby="place-add-title" onSubmit={handleAddPlace} onMouseDown={(event) => event.stopPropagation()}>
          <h2 id="place-add-title" className="place-add-title">장소추가</h2>
          <input ref={addressInputRef} className="place-add-input" type="text" aria-label="주소" placeholder="주소 입력" value={address} onChange={(event) => setAddress(event.target.value)} disabled={busy} required />
          <p className="map-api-error" role="alert">{error}{error && !getToken() && <> <Link to="/islogin" state={{ from: '/map' }}>로그인하기</Link></>}</p>
          <div className="place-add-actions"><button type="button" className="place-add-btn place-add-cancel" disabled={busy} onClick={() => setIsPlaceAddOpen(false)}>취소</button><button type="submit" className="place-add-btn place-add-confirm" disabled={busy}>{busy ? '추가 중…' : '확인'}</button></div>
        </form>
      </div>}
    </div>
  );
}
export default Map;
