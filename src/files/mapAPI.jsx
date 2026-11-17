import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/mapAPI.css';
import { useSchedules } from '../hooks/useSchedules.js';
import { formatDate } from '../data/scheduleDates.js';
import { placeStore } from '../data/placeStore.js';
import { loadKakaoMaps } from '../services/kakaoMapSdk.js';
import mappin from '../icons/mappin.png';

const KAKAO_MAP_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim();
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const NEARBY_CATEGORIES = [
  { key: 'all', label: '전체', codes: ['AT4', 'FD6', 'CE7', 'AD5', 'MT1', 'CS2'] },
  { key: 'food', label: '음식점', codes: ['FD6'] },
  { key: 'cafe', label: '카페', codes: ['CE7'] },
  { key: 'lodging', label: '숙박', codes: ['AD5'] },
  { key: 'shopping', label: '구매점', codes: ['MT1', 'CS2'] },
];

function MapAPI() {
  const { startDate, endDate, events } = useSchedules();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const nearbyMarkersRef = useRef([]);
  const savedPlaceMarkersRef = useRef([]);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const nearbyRequestRef = useRef(0);
  const savedPlacesRequestRef = useRef(0);
  const locationRequestRef = useRef(0);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [mapStatus, setMapStatus] = useState('loading');
  const [locationStatus, setLocationStatus] = useState('내 위치를 찾고 있어요.');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [nearbyCategory, setNearbyCategory] = useState('all');
  const [nearbyStatus, setNearbyStatus] = useState('loading');
  const [selectedPlace, setSelectedPlace] = useState(null);

  const openLocationDetails = useCallback((position) => {
    const lat = position.getLat();
    const lng = position.getLng();
    setSelectedPlace({ key: 'current-location', kind: 'current', title: '내 위치', address: '주소를 확인하고 있어요.', lat, lng });
    geocoderRef.current?.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result?.[0]) {
        const address = result[0].road_address?.address_name || result[0].address?.address_name || '주소 정보를 찾지 못했어요.';
        setSelectedPlace((current) => current?.key === 'current-location' ? { ...current, address } : current);
      } else {
        setSelectedPlace((current) => current?.key === 'current-location' ? { ...current, address: '주소 정보를 찾지 못했어요.' } : current);
      }
    });
  }, []);

  const locateMe = useCallback(() => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps) return;

    if (!navigator.geolocation) {
      setLocationStatus('위치를 확인할 수 없어요.');
      return;
    }

    const requestId = locationRequestRef.current + 1;
    locationRequestRef.current = requestId;
    setLocationStatus('내 위치를 찾고 있어요.');
    navigator.geolocation.getCurrentPosition((position) => {
      if (requestId !== locationRequestRef.current) return;
      const { latitude, longitude } = position.coords;
      const positionOnMap = new kakao.maps.LatLng(latitude, longitude);
      map.setCenter(positionOnMap);

      if (!markerRef.current) {
        const markerImage = new kakao.maps.MarkerImage(
          mappin,
          new kakao.maps.Size(38, 38),
          { offset: new kakao.maps.Point(19, 36) },
        );
        markerRef.current = new kakao.maps.Marker({ position: positionOnMap, image: markerImage });
        markerRef.current.setClickable(true);
        kakao.maps.event.addListener(markerRef.current, 'click', () => openLocationDetails(markerRef.current.getPosition()));
      } else {
        markerRef.current.setPosition(positionOnMap);
      }
      markerRef.current.setMap(map);
      setMapCenter({ lat: latitude, lng: longitude });
      setLocationStatus('현재 위치를 지도에 표시하고 있어요.');
    }, () => {
      if (requestId !== locationRequestRef.current) return;
      setLocationStatus('위치를 찾지 못했어요. 권한을 확인하거나 다시 시도해 주세요.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }, [openLocationDetails]);

  const searchNearby = useCallback((categoryCode, center) => {
    const kakao = window.kakao;
    const map = mapRef.current;
    const places = placesServiceRef.current;
    if (!map || !places || !kakao?.maps?.services) return;
    const category = NEARBY_CATEGORIES.find((item) => item.key === categoryCode);
    if (!category) return;

    const requestId = nearbyRequestRef.current + 1;
    nearbyRequestRef.current = requestId;
    setNearbyStatus('loading');
    nearbyMarkersRef.current.forEach((marker) => marker.setMap(null));
    nearbyMarkersRef.current = [];
    const location = new kakao.maps.LatLng(center.lat, center.lng);

    Promise.all(category.codes.map((code) => new Promise((resolve) => {
      places.categorySearch(code, (results, status) => resolve({ results, status }), {
        location,
        radius: 3000,
        size: 15,
        sort: kakao.maps.services.SortBy.DISTANCE,
      });
    }))).then((responses) => {
      if (requestId !== nearbyRequestRef.current) return;
      const successfulResponses = responses.filter(({ status }) => status === kakao.maps.services.Status.OK);
      if (!successfulResponses.length) {
        const hasError = responses.some(({ status }) => status !== kakao.maps.services.Status.ZERO_RESULT);
        setNearbyStatus(hasError ? 'error' : 'empty');
        return;
      }

      const placesById = new Map();
      successfulResponses.forEach(({ results }) => {
        (Array.isArray(results) ? results : []).forEach((place) => placesById.set(place.id, place));
      });
      const results = [...placesById.values()]
        .sort((first, second) => Number(first.distance || Infinity) - Number(second.distance || Infinity))
        .slice(0, categoryCode === 'all' ? 24 : 12);

      results.forEach((place) => {
        const position = new kakao.maps.LatLng(Number(place.y), Number(place.x));
        const marker = new kakao.maps.Marker({ map, position, title: place.place_name, clickable: true });
        kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedPlace({
            key: `nearby-${place.id}`,
            kind: 'nearby',
            title: place.place_name,
            category: place.category_group_name || place.category_name,
            address: place.road_address_name || place.address_name || '주소 정보를 찾지 못했어요.',
            phone: place.phone,
            placeUrl: place.place_url,
            lat: Number(place.y),
            lng: Number(place.x),
          });
        });
        nearbyMarkersRef.current.push(marker);
      });
      setNearbyStatus(placesById.size ? 'ready' : 'empty');
    });
  }, []);

  useEffect(() => {
    let disposed = false;
    if (!KAKAO_MAP_APP_KEY) {
      setMapStatus('missing-key');
      return () => { disposed = true; };
    }

    loadKakaoMaps(KAKAO_MAP_APP_KEY).then((kakao) => {
      if (disposed || !mapContainerRef.current) return;
      const map = new kakao.maps.Map(mapContainerRef.current, {
        center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        level: 5,
      });
      mapRef.current = map;
      placesServiceRef.current = new kakao.maps.services.Places(map);
      geocoderRef.current = new kakao.maps.services.Geocoder();
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      kakao.maps.event.addListener(map, 'idle', () => {
        const center = map.getCenter();
        setMapCenter({ lat: center.getLat(), lng: center.getLng() });
      });
      setMapStatus('ready');
      locateMe();
    }).catch(() => {
      if (!disposed) setMapStatus('error');
    });

    return () => {
      disposed = true;
      locationRequestRef.current += 1;
      nearbyRequestRef.current += 1;
      savedPlacesRequestRef.current += 1;
      nearbyMarkersRef.current.forEach((marker) => marker.setMap(null));
      savedPlaceMarkersRef.current.forEach((marker) => marker.setMap(null));
      mapRef.current = null;
      markerRef.current = null;
      placesServiceRef.current = null;
      geocoderRef.current = null;
    };
  }, [locateMe]);

  useEffect(() => {
    if (mapStatus !== 'ready') return undefined;
    searchNearby(nearbyCategory, mapCenter);
    return () => { nearbyRequestRef.current += 1; };
  }, [mapStatus, nearbyCategory, mapCenter, searchNearby]);

  useEffect(() => {
    if (mapStatus !== 'ready' || !geocoderRef.current || !mapRef.current) return undefined;
    const requestId = savedPlacesRequestRef.current + 1;
    savedPlacesRequestRef.current = requestId;
    savedPlaceMarkersRef.current.forEach((marker) => marker.setMap(null));
    savedPlaceMarkersRef.current = [];
    const kakao = window.kakao;
    const map = mapRef.current;
    const markerImage = new kakao.maps.MarkerImage(
      mappin,
      new kakao.maps.Size(38, 38),
      { offset: new kakao.maps.Point(19, 36) },
    );

    placeStore.read().forEach((savedPlace) => {
      geocoderRef.current.addressSearch(savedPlace.address, (results, status) => {
        if (requestId !== savedPlacesRequestRef.current || status !== kakao.maps.services.Status.OK || !results?.[0]) return;
        const result = results[0];
        const position = new kakao.maps.LatLng(Number(result.y), Number(result.x));
        const marker = new kakao.maps.Marker({ map, position, image: markerImage, title: savedPlace.address, clickable: true });
        kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedPlace({
            key: `saved-${savedPlace.id}`,
            kind: 'saved',
            title: savedPlace.address,
            address: result.road_address?.address_name || result.address?.address_name || savedPlace.address,
            lat: Number(result.y),
            lng: Number(result.x),
          });
        });
        savedPlaceMarkersRef.current.push(marker);
      });
    });

    return () => { savedPlacesRequestRef.current += 1; };
  }, [mapStatus]);

  const scheduleEvents = [...events].sort((first, second) => (
    first.date.localeCompare(second.date) || first.time.localeCompare(second.time)
  )).slice(0, 4);
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent('GoTrip')},${mapCenter.lat},${mapCenter.lng}`;

  return (
    <main className="mini-map-background map-api-page">
      <div ref={mapContainerRef} className="kakao-map-canvas" aria-label="현재 위치 주변 카카오 지도" />
      <p className="map-api-sr-only" role="status">{locationStatus}</p>

      {mapStatus !== 'ready' && (
        <div className={`map-api-loading${mapStatus === 'error' || mapStatus === 'missing-key' ? ' is-error' : ''}`} role={mapStatus === 'loading' ? 'status' : 'alert'}>
          {mapStatus === 'loading' && '카카오 지도를 불러오고 있어요.'}
          {mapStatus === 'missing-key' && '카카오 지도 키가 설정되지 않았어요. .env.local의 VITE_KAKAO_MAP_APP_KEY를 확인해 주세요.'}
          {mapStatus === 'error' && '카카오 지도를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.'}
        </div>
      )}

      <header className="map-api-toolbar">
        <div className="map-api-toolbar-actions">
          <Link className="map-api-control-button map-api-return-link" to="/map"><span aria-hidden="true">←</span>돌아가기</Link>
          <button type="button" className="map-api-control-button" onClick={locateMe} disabled={mapStatus !== 'ready'}>내 위치</button>
          <a className="map-api-kakao-link" href={kakaoMapUrl} target="_blank" rel="noreferrer">카카오맵에서 보기<span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <div className="map-api-nearby-controls" role="group" aria-label="장소 종류">
        {NEARBY_CATEGORIES.map((category) => (
          <button key={category.key} type="button" aria-pressed={nearbyCategory === category.key}
            className={nearbyCategory === category.key ? 'is-selected' : ''}
            onClick={() => setNearbyCategory(category.key)}>{category.label}</button>
        ))}
        {nearbyStatus === 'empty' && <small role="status">이 주변에는 장소가 없어요.</small>}
        {nearbyStatus === 'error' && <small role="status">주변 장소를 불러오지 못했어요.</small>}
      </div>

      {selectedPlace && (
        <aside className="map-api-place-detail" aria-labelledby="map-api-place-title">
          <div className="map-api-place-detail-topline">
            <span>{selectedPlace.kind === 'current' ? '현재 위치' : selectedPlace.kind === 'saved' ? '내가 저장한 장소' : selectedPlace.category || '주변 장소'}</span>
            <button type="button" aria-label="장소 정보 닫기" onClick={() => setSelectedPlace(null)}>×</button>
          </div>
          <h2 id="map-api-place-title">{selectedPlace.title}</h2>
          <dl>
            <div><dt>주소</dt><dd>{selectedPlace.address}</dd></div>
            {selectedPlace.phone && <div><dt>전화</dt><dd><a href={`tel:${selectedPlace.phone.replace(/[^\d+]/g, '')}`}>{selectedPlace.phone}</a></dd></div>}
          </dl>
          <a className="map-api-place-link" href={selectedPlace.placeUrl || `https://map.kakao.com/link/map/${encodeURIComponent(selectedPlace.title)},${selectedPlace.lat},${selectedPlace.lng}`}
            target="_blank" rel="noreferrer">카카오맵에서 보기<span aria-hidden="true">↗</span></a>
        </aside>
      )}

      <aside className={`map-api-schedule${scheduleOpen ? '' : ' is-collapsed'}`} aria-label="여행 일정 요약">
        <section id="map-api-schedule-panel" className="map-api-schedule-card" hidden={!scheduleOpen}>
          <header className="map-api-schedule-heading">
            <div>
              <h2>내 여행 일정</h2>
            </div>
            <Link to="/calendar">전체 일정</Link>
          </header>
          <p className="map-api-trip-dates">
            {formatDate(startDate, { month: 'long', day: 'numeric' })} – {formatDate(endDate, { month: 'long', day: 'numeric' })}
          </p>
          <div className="map-api-schedule-list" aria-live="polite">
            {scheduleEvents.length === 0 ? <p className="map-api-schedule-empty">아직 등록한 일정이 없어요.</p> : scheduleEvents.map((event) => (
              <article className="map-api-schedule-item" key={event.id}>
                <time dateTime={`${event.date}T${event.time}`}>
                  <span>{formatDate(event.date, { month: 'numeric', day: 'numeric' })}</span>
                  <strong>{event.time}</strong>
                </time>
                <p>{event.content}</p>
              </article>
            ))}
            {events.length > scheduleEvents.length && <p className="map-api-more-events">일정 {events.length - scheduleEvents.length}개 더 보기</p>}
          </div>
        </section>
        <button type="button" className="map-schedule-toggle" aria-controls="map-api-schedule-panel" aria-expanded={scheduleOpen}
          aria-label={scheduleOpen ? '스케줄 접기' : '스케줄 펼치기'} title={scheduleOpen ? '스케줄 접기' : '스케줄 펼치기'}
          onClick={() => setScheduleOpen((open) => !open)}>
          <span aria-hidden="true">{scheduleOpen ? '‹' : '›'}</span>
        </button>
      </aside>
    </main>
  );
}

export default MapAPI;
