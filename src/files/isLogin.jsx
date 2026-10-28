import gotriplogo2 from '../images/gotrip-logo2.png';
import gotriplogotext from '../images/gotrip-logotext.png';
import gotripbackground from '../images/gotrip-join.jpeg';
import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../services/authApi';
import '../styles/isLogin.css';


function IsLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      await login({ loginId, password });
      const destination = location.state?.from;
      navigate(typeof destination === 'string' && (/^\/chat(?:\/|$)/.test(destination) || destination === '/memo') ? destination : '/main', { replace: true });
    } catch (reason) { setError(reason.message || '로그인하지 못했어요. 다시 시도해 주세요.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return(
    <div className='login-container'>
      <div className='login-left'>
        <div className='service-start'>
          <img src={gotriplogo2} alt="gotrip-logo2" className='gotrip-logo2'/><br />
          <img src={gotriplogotext} alt="gotrip-logotext" className='gotrip-logotext'/>
          <h2>서비스를 시작하려면 로그인 하세요.</h2>
        </div>

        {location.state?.signupComplete && <p className="login-success" role="status">회원가입이 완료되었습니다. 가입한 아이디와 비밀번호로 로그인해주세요.</p>}
        <form onSubmit={submit}>
        <div className='text-in'>
          <input type="text" aria-label="아이디" autoComplete="username" placeholder='아이디' required value={loginId} onChange={(event) => setLoginId(event.target.value)} disabled={busy} />
          <input type="password" aria-label="비밀번호" autoComplete="current-password" placeholder='비밀번호' required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          <p className='forgot-pw'>비밀번호를 잊으셨나요? <span className='lets-find'>찾으러 가기</span></p>
        </div>

        <div className='login-button'>
          <p className="login-error" role="alert">{error}</p>
          <button type="submit" className='lets-login' disabled={busy || !loginId.trim() || !password}>{busy ? '로그인 중…' : '로그인'}</button>
        </div>
        </form>

        <div className='ifyou-not'>
          <p>계정이 없으시다면? <span className='lets-signup' onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>회원가입 하러가기</span>
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
