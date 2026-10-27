import '../styles/mapAPI.css';
import SchedulePanel from '../components/SchedulePanel';
import mappin from '../icons/mappin.png';

function MapAPI() {
  return (
    <div className='mini-map-background'>
      <SchedulePanel compact />
      <img src={mappin} alt='mappin' className='mappin'/>
    </div>
  );
}
export default MapAPI;
