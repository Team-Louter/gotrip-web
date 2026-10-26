import '../styles/chatRoom.css'
import gotrippro from '../images/gotrip-pro.jpg'
import gotripsearch from '../icons/gotrip-search.png'
import gotriplogo4 from '../images/gotrip-logo4.png'
import { useNavigate } from 'react-router-dom';

function ChatRoom() {
  const navigate = useNavigate();
  return (
    <div className="chatroom-layout">
      <div className="chat-left">
       <div className="chat-header">
          <h2 className='chat-h'>chats</h2>
          <div className="search-box">
            <input className='chattext-input' type="text" />
            <img className="search-icon" src={gotripsearch} alt="search" />
          </div>
       </div>
       <div className="chat-bar"></div>

        <div className="chat-item">
          <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
          <div>
            <p className='chatroom-name'>team 제주도</p>
            <p className='chat-detail'>한라봉 먹고오자</p>
          </div>
        </div>

          <div className="chat-item">
            <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
            <div>
              <p className='chatroom-name'>team 제주도</p>
              <p className='chat-detail'>한라봉 먹고오자</p>
            </div>
          </div>

          <div className="chat-item">
            <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
            <div>
              <p className='chatroom-name'>team 제주도</p>
              <p className='chat-detail'>한라봉 먹고오자</p>
            </div>
          </div>

          <div className="chat-item">
            <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
            <div>
              <p className='chatroom-name'>team 제주도</p>
              <p className='chat-detail'>한라봉 먹고오자</p>
            </div>
          </div>

          <div className="chat-item">
            <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
            <div>
              <p className='chatroom-name'>team 제주도</p>
              <p className='chat-detail'>한라봉 먹고오자</p>
            </div>
          </div>

          <div className="chat-item">
            <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
            <div>
              <p className='chatroom-name'>team 제주도</p>
              <p className='chat-detail'>한라봉 먹고오자</p>
            </div>
          </div>

          <div className="chat-item">
            <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
            <div>
              <p className='chatroom-name'>team 제주도</p>
              <p className='chat-detail'>한라봉 먹고오자</p>
            </div>
          </div>

          <div className="chat-item">
            <img className='gotrip-pro' src={gotrippro} alt="gotrip-profile" />
            <div>
              <p className='chatroom-name'>team 제주도</p>
              <p className='chat-detail'>한라봉 먹고오자</p>
            </div>
          </div>
        </div>

        <div className='chat-plus'>
           <p>+</p>
        </div>
      </div>
      
      <div className="chat-right">
        <img  className='chat-gotriplogo' src={gotriplogo4} alt="gotrip-logo" />
        <div className='chat-empty'>
          <p className='lets-plan'>여행 계획이라도 짜볼까요?</p>
          <button className='lets-main' onClick={() => navigate('/calendar')} style={{ cursor: 'pointer' }}>
            캘린더로 가기
          </button>
        </div>
        
      </div>
      

    
    </div>
  )
}

export default ChatRoom
                            