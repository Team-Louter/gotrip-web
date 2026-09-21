import SideBar from './components/sideBar';
import MainPage from './files/mainPage';
import Map from './files/map';
import MapAPI from './files/mapAPI';
import './App.css';

function App() {
  return (
    <div className="layout">
      <SideBar />
      <MapAPI />
    </div>
  );
}
export default App;
