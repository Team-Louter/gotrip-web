import gotriplogo3 from '../images/gotrip-logo3.png'
import gotriplogo2 from '../images/gotrip-logo2.png'


function IsLogin() {
  return(
    <div>
      <div>
        <img src={gotriplogo3} alt="gotrip3-logo" /><br />
        <img src={gotriplogo2} alt="gotrip-logo2" />
        <p>서비스를 시작하려면 로그인 하세요.</p>
      </div>
      <div>
        <input type="text" placeholder='아이디' /> <br />
        <input type="text" placeholder='비밀번호'/>
        <p>비밀번호를 잊으셨나요? <span>찾으러 가기</span></p>
      </div>
      

      <p>계정이 없으시다면?</p>
      <p>회원가입 하러가기</p>
      
    </div>
  )
}

export default IsLogin