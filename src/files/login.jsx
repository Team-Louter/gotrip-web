import gotriplogo2 from '../images/gotrip-logo2.png';
import gotriplogotext from '../images/gotrip-logotext.png';
import gotripbackground from '../images/gotrip-join.jpeg';
import gotripbackgroundUpscaled from '../images/gotrip-join-upscaled.jpeg';
import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStartPage } from '../data/settings';
import { login } from '../services/authApi';
import '../styles/login.css';
import Toast from '../components/Toast';


function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.signupComplete ? '회원가입이 완료되었습니다. 가입한 아이디와 비밀번호로 로그인해주세요.' : '');
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const values = new FormData(event.currentTarget);
    const enteredLoginId = String(values.get('loginId') || '').trim();
    const enteredPassword = String(values.get('password') || '');
    if (!enteredLoginId || !enteredPassword) return setError('아이디와 비밀번호를 입력해주세요.');
    submitting.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await login({ loginId: enteredLoginId, password: enteredPassword });
      const destination = location.state?.from;
      navigate(typeof destination === 'string' && (/^\/chat(?:\/|$)/.test(destination) || ['/home', '/friends', '/map', '/places', '/calendar', '/memo', '/payment', '/settings'].includes(destination)) ? destination : getStartPage(), { replace: true });
    } catch (reason) { setError(reason.message || '로그인하지 못했어요. 다시 시도해 주세요.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return(
    <div className='login-container'>
      <div className='login-left'>
        <div className='service-start'>
          <img src={gotriplogo2} alt="" className='gotrip-logo2'/>
          <img src={gotriplogotext} alt="gotrip-logotext" className='gotrip-logotext'/>
          <h2>서비스를 시작하려면 로그인 하세요.</h2>
        </div>

        <form onSubmit={submit}>
        <div className='text-in'>
          <input name="loginId" type="text" aria-label="아이디" autoComplete="username" placeholder='아이디' required value={loginId} onChange={(event) => setLoginId(event.target.value)} disabled={busy} />
          <input name="password" type="password" aria-label="비밀번호" autoComplete="current-password" placeholder='비밀번호' required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
        </div>

        <div className='login-button'>
          <button type="submit" className='lets-login' disabled={busy || !loginId.trim() || !password}>{busy ? '로그인 중…' : '로그인'}</button>
        </div>
        </form>

        <div className='ifyou-not'>
          <p>계정이 없으시다면? <Link className='lets-signup' to="/registration">회원가입</Link>
          </p>
        </div>

       </div>

       <div className="login-right">
         <img src={gotripbackground} srcSet={`${gotripbackground} 3024w, ${gotripbackgroundUpscaled} 6048w`} sizes="(max-width: 800px) 1px, 66vw" alt="" className='gotrip-background' decoding="async" />
       </div>

      <Toast key={error || notice} message={error || notice} onClose={error ? setError : setNotice} tone={error ? 'error' : 'success'} />

    </div>
  )
}

export default Login
