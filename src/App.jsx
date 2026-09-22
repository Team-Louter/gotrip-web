import SideBar from './components/sideBar';
import MainPage from './files/mainPage';
import Map from './files/map';
import MapAPI from './files/mapAPI';
import './App.css';
import ChatRoom from './files/chatRoom';
import Calender from './files/calender';
import ChatHome from './files/chatHome';
import IsLogin  from './files/isLogin';
import PayFrom from './files/payForm'
import SignUp from './files/signUp'
import SignUpTerms from './files/signUpTerms'
import MemoPages from './files/memoPage'

function App() {
  return (
    <div className="layout">
      <SideBar />
      < MemoPages/>
    </div>
    // <SignUpTerms/>

  );
}
export default App;
