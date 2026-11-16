import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadKakaoMaps } from '../services/kakaoMapSdk.js';
import mappin from '../icons/mappin.png';

const KAKAO_MAP_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY;
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export default function KakaoMapPreview() {
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const [mapStatus, setMapStatus] = useState('loading');
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    let disposed = false;
    if (!KAKAO_MAP_APP_KEY) {
      setMapStatus('error');
      return () => { disposed = true; };
    }

    loadKakaoMaps(KAKAO_MAP_APP_KEY).then((kakao) => {
      if (disposed || !containerRef.current) return;
      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        level: 5,
      });
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);

      if (!navigator.geolocation) {
        setLocationError(true);
        setMapStatus('ready');
        return;
      }

      navigator.geolocation.getCurrentPosition((position) => {
        if (disposed) return;
        const currentPosition = new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(currentPosition);
        const markerImage = new kakao.maps.MarkerImage(
          mappin,
          new kakao.maps.Size(38, 38),
          { offset: new kakao.maps.Point(19, 36) },
        );
        markerRef.current = new kakao.maps.Marker({ map, position: currentPosition, image: markerImage, title: '내 위치' });
        setMapStatus('ready');
      }, () => {
        if (disposed) return;
        setLocationError(true);
        setMapStatus('ready');
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });

      setMapStatus('ready');
    }).catch(() => {
      if (!disposed) setMapStatus('error');
    });

    return () => {
      disposed = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
    };
  }, []);

  return (
    <section className="map-preview-map" aria-label="현재 위치 주변 지도">
      <div ref={containerRef} className="map-preview-canvas" />
      {mapStatus !== 'ready' && (
        <p className="map-preview-message" role={mapStatus === 'loading' ? 'status' : 'alert'}>
          {mapStatus === 'loading' ? '지도를 불러오고 있어요.' : '지도를 불러오지 못했어요.'}
        </p>
      )}
      {mapStatus === 'ready' && locationError && <p className="map-preview-location-note" role="status">위치를 확인할 수 없어요.</p>}
      <Link className="map-preview-open-map" to="/places">지도 크게 보기<span aria-hidden="true">↗</span></Link>
    </section>
  );
}
