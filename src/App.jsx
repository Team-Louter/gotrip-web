import SideBar from './components/sideBar';
import MainPage from './files/mainPage';
import Map from './files/map';
import MapAPI from './files/mapAPI';
import Calender from './files/calender';
import ChatHome from './files/chatHome';
import ChatRoom from './files/chatRoom';
import IsLogin from './files/isLogin';
import MemoPage from './files/memoPage';
import PayForm from './files/payForm';
import SignUp from './files/signUp';
import SignUp2 from './files/signUp2';
import SignUpTerms from './files/signUpTerms';
import './App.css';
import Memo from './files/memoPage';

function App() {
  return (
    <div className="layout">
      <SideBar />
      <Map />
    </div>
  );
}
export default App;
