import gotriplogo from '../images/gotrip-logo.png'
import gotripjoin from '../images/gotrip-join.jpeg'
import gotripcheck from '../images/gotrip-check.png'
import '../styles/signUp.css';

function SignUp() {
  return (

    <div className='join-cont'>
      <h1>회원 정보를 입력해주세요.</h1>
      <div className='card-wap'>
        <img className='gotrip-join' src={gotripjoin} alt="join-image" />
        <div className='card-from'>
          <img className='gotrip-logo' src={gotriplogo} alt="gotrip-logo" />
          <p>아이디</p>
          <input type="text" />
          <p>비밀번호 <br />
            <input type="text" />
          </p>
            <ul><img className='check' src={gotripcheck} alt="check" />8자 이상, 20자 이하</ul>
            <ul><img className='check' src={gotripcheck} alt="check" />대소문자, 숫자, 특수문자 3개 이상 조합</ul>
            <ul><img className='check' src={gotripcheck} alt="check" />3자 이상 동일 문자/숫자 연속 사용 금지(예:aaa, 111)</ul>
          <p>비밀번호 확인</p>
          <input type="text" />
          <br />
          <button className='Next-button'>다음</button>
        </div>
        
      </div>

      
      
    </div>
    

  )
}

export default SignUp;