import '../styles/chatHome.css'
import gotrippro from '../images/gotrip-pro.jpg'
import gotripsearch from '../icons/gotrip-search.png'
import gotripcamers from '../icons/gotrip-camera.png'
import gotripclip from '../icons/gotrip-clip.png'
import gotripsmile from '../icons/gotrip-smile.png'
import gotripplane from '../icons/gotrip-plane.png'
import gotripdots from '../icons/gotrip-dots.png'
import gotripreply from '../icons/gotrip-reply.png'



function ChatRoom() {
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
      
        <div className="chat-list">
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
      

      <div className="chat-main">

        <div className="room-header">
          <img className="room-profile" src={gotrippro} alt="profile" />
          <div>
            <p className="room-name">송하율</p>
            <p className="room-status">현재 활동중 ●</p>
          </div>
        </div>

        <div className="message-area">

          <div className="msg-row">
            <img className="msg-profile" src={gotrippro} alt="profile" />
            <div>
              <p className="left-bubble">제주도 가는거 너무 설렌당</p>
              <p className="msg-time">04:45 PM</p>
            </div>

            <div className='chat-emotion'>
              <img className='chat-dots' src={gotripdots} alt="gotrip-dots" />
              <img className='chat-smile' src={gotripsmile} alt="gotrip-smile" />
              <img className='chat-reply' src={gotripreply} alt="gotrip-reply" />
            </div>
          </div>

          <div className="me-row">
            <div>
              <p className="right-bubble">그니까 빨리 가고싶다</p>
              <p className="me-time">04:45 PM</p>
            </div>

            <div className='chat-emotion'>
              <img className='rightchat-dots' src={gotripdots} alt="gotrip-dots" />
              <img className='rightchat-smile' src={gotripsmile} alt="gotrip-smile" />
              <img className='rightchat-reply' src={gotripreply} alt="gotrip-reply" />
            </div>
          </div>

          <div className="msg-row">
            <img className="msg-profile" src={gotrippro} alt="profile" />
            <div>
              <p className="left-bubble">가서 뭐할거야?</p>
              <p className="msg-time">04:46 PM</p>
            </div>

            <div className='chat-emotion'>
              <img className='chat-dots' src={gotripdots} alt="gotrip-dots" />
              <img className='chat-smile' src={gotripsmile} alt="gotrip-smile" />
              <img className='chat-reply' src={gotripreply} alt="gotrip-reply" />
            </div>
            <div>

            </div>
          </div>

          <div className="me-row">
            <div>
              <p className="right-bubble">요즘 한라봉이 그렇게 맛있대</p>
              <p className="me-time">04:46 PM</p>
            </div>

            <div className='chat-emotion'>
              <img className='rightchat-dots' src={gotripdots} alt="gotrip-dots" />
              <img className='rightchat-smile' src={gotripsmile} alt="gotrip-smile" />
              <img className='rightchat-reply' src={gotripreply} alt="gotrip-reply" />
            </div>
          </div>

          <div className="msg-row">
            <img className="msg-profile" src={gotrippro} alt="profile" />
            <div>
              <p className="left-bubble">한라봉 먹고오자</p>
              <p className="msg-time">04:47 PM</p>
            </div>

            <div className='chat-emotion'>
              <img className='chat-dots' src={gotripdots} alt="gotrip-dots" />
              <img className='chat-smile' src={gotripsmile} alt="gotrip-smile" />
              <img className='chat-reply' src={gotripreply} alt="gotrip-reply" />
            </div>
          </div>

        </div>

        <div className="input-area">
          <img src={gotripcamers} alt='gotrip-camera' className="input-icon"/>
          <img src={gotripclip} alt='gotrip-clip' className="input-icon"/>
          <input className="message-input" type="text" placeholder='  메세지 입력...'/>
          <img src={gotripsmile} alt='gotrip-smile' className="input-icon"/>
          <img src={gotripplane} alt='gotrip-plane' className="input-icon"/>
        </div>

      </div>
      

   
      

    
    </div>
  )
}

export default ChatRoom