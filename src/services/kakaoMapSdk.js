const KAKAO_MAP_SDK_ID = 'gotrip-kakao-map-sdk';
let kakaoMapsPromise;

export function loadKakaoMaps(appKey) {
  if (window.kakao?.maps?.Map) {
    return window.kakao.maps.services
      ? Promise.resolve(window.kakao)
      : Promise.reject(new Error('장소 정보를 불러오려면 지도를 새로고침해 주세요.'));
  }
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(KAKAO_MAP_SDK_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = KAKAO_MAP_SDK_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
      document.head.appendChild(script);
    }

    script.addEventListener('load', () => {
      if (!window.kakao?.maps?.load) {
        reject(new Error('Kakao 지도 SDK를 초기화하지 못했습니다.'));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao));
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('Kakao 지도 SDK 요청에 실패했습니다.')), { once: true });
  }).catch((error) => {
    kakaoMapsPromise = undefined;
    document.getElementById(KAKAO_MAP_SDK_ID)?.remove();
    throw error;
  });

  return kakaoMapsPromise;
}
