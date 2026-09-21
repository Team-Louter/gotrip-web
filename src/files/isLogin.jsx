import gotriplogo2 from '../images/gotrip-logo2.png';
import gotriplogotext from '../images/gotrip-logotext.png';
import gotripbackground from '../images/gotrip-join.jpeg'
import '../styles/isLogin.css';


function IsLogin() {
  return(
    <div className='login-container'>
      <div className='login-left'>
        <div className='service-start'>
          <img src={gotriplogo2} alt="gotrip-logo2" className='gotrip-logo2'/><br />
          <img src={gotriplogotext} alt="gotrip-logotext" className='gotrip-logotext'/>
          <h2>서비스를 시작하려면 로그인 하세요.</h2>
        </div>
    
        <div className='text-in'>
          <input type="text" placeholder='아이디' />
          <input type="text" placeholder='비밀번호'/>
          <p className='forgot-pw'>비밀번호를 잊으셨나요? <span className='lets-find'>찾으러 가기</span></p>
        </div>

        <div className='login-button'>
          <button>로그인</button>
        </div>
 
        <div className='ifyou-not'>
          <p>계정이 없으시다면? <span className='lets-signup'>회원가입 하러가기</span>
          </p>
        </div>

       </div>

       <div className="login-right">
         <img src={gotripbackground} alt="background" className='gotrip-background'/>
       </div>

      
      
      
     
      
      
    </div>
  )
}

export default IsLogin