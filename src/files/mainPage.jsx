  import '../styles/mainPage.css'
  import { useNavigate } from 'react-router-dom';
  import { getRandomMessage } from "../data/mainPageMessages";

  function MainPage() {
    const navigate = useNavigate();
    return (
      <div className='main-page-box'>
        <div className='element-box'>
          <span className='few-word'>{getRandomMessage().text}</span>
          <span className='project-button' onClick={() => navigate('/chat/:roomId')} style={{ cursor: 'pointer' }}>우선 여행방부터 만들어볼까요?</span>
        </div>
      </div>
    );
  }
  export default MainPage;