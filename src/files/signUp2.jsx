import gotriplogo from '../images/gotrip-logo.png'
import gotripjoin from '../images/gotrip-join.jpeg'
import { useNavigate } from 'react-router-dom';
import '../styles/signUp.css';

function SignUp2() {
  const navigate = useNavigate();

  return (

    <div className='join-cont'>
      <h1>회원 정보를 입력해주세요.</h1>
      <div className='card-wap'>
        <img className='gotrip-join' src={gotripjoin} alt="join-image" />
        <div className='card-from'>
          <img className='gotrip-logo' src={gotriplogo} alt="gotrip-logo" />
          <p>생년월일</p>
          <input type="text" placeholder='YYYY/MM/DD'/>
          <p>이메일 입력 <br />
            <input type="text" placeholder='@포함'/>
          </p>
          <p>닉네임</p>
          <input type="text" />
          <br />
          <button className='Next-button' onClick={() => navigate('/signup/terms')}>다음</button>
        </div>
      </div>
    </div>
    
  )
}

export default SignUp2;