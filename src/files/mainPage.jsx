import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomMessage } from '../data/mainPageMessages';
import mainTravelImage1 from '../images/main-travel-1.jpg';
import mainTravelImage2 from '../images/main-travel-2.jpg';
import mainTravelImage3 from '../images/main-travel-3.jpg';
import '../styles/mainPage.css';

const mainTravelImages = [mainTravelImage1, mainTravelImage2, mainTravelImage3];

function MainPage() {
  const navigate = useNavigate();
  const [hero] = useState(() => ({
    message: getRandomMessage().text,
    image: mainTravelImages[Math.floor(Math.random() * mainTravelImages.length)],
  }));

  return (
    <div className="main-page-box" style={{ backgroundImage: `url("${hero.image}")` }}>
      <div className="element-box">
        <span className="few-word">{hero.message}</span>
        <span className="project-button" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>채팅방부터 만들어볼까요?</span>
      </div>
    </div>
  );
}

export default MainPage;
