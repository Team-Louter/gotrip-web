import PayForm from './files/PayForm.jsx'
import SideBar from './components/sideBar.jsx'
import ChatRoom from './files/chatRoom.jsx';
import MemoPage from './files/memoPage.jsx';
import ChatHome from './files/chatHome.jsx'

function App() {
  return (
    <div>
      <div style={{ display: "flex" }}>
      <SideBar />
      <div style={{ flex: 1 }}>
        {/* <PayForm />    */}
        {/* <ChatRoom/> */}
        {/* <MemoPage/> */}
        <ChatHome/>
      </div>
    </div>
    </div>
  );
}

export default App;