import { useState } from 'react';
import '../styles/mapAPI.css';
import SchedulePanel from '../components/SchedulePanel';
import mappin from '../icons/mappin.png';

function MapAPI() {
  const [scheduleOpen, setScheduleOpen] = useState(true);
  return (
    <div className='mini-map-background'>
      <aside className={`map-api-schedule${scheduleOpen ? '' : ' is-collapsed'}`} aria-label="지도 스케줄">
        <div id="map-api-schedule-panel" hidden={!scheduleOpen}>
          <SchedulePanel compact />
        </div>
        <button type="button" className="map-schedule-toggle" aria-controls="map-api-schedule-panel" aria-expanded={scheduleOpen}
          aria-label={scheduleOpen ? '스케줄 접기' : '스케줄 펼치기'} title={scheduleOpen ? '스케줄 접기' : '스케줄 펼치기'}
          onClick={() => setScheduleOpen((open) => !open)}>
          <span aria-hidden="true">{scheduleOpen ? '‹' : '›'}</span>
        </button>
      </aside>
      <img src={mappin} alt='mappin' className='mappin'/>
    </div>
  );
}
export default MapAPI;
