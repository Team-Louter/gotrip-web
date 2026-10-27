import { useState } from 'react';
import gotriplogo2 from '../images/gotrip-logo2.png';
import gotriplogotext from '../images/gotrip-logotext.png';
import gotripbackground from '../images/gotrip-join.jpeg';
import { useLocation, useNavigate } from 'react-router-dom';
import { logIn } from '../services/authApi';
import '../styles/isLogin.css';

function IsLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await logIn(loginId.trim(), password);
      localStorage.setItem('gotrip.auth.token', result.token);
      navigate('/main', { replace: true });
    } catch (requestError) {
      setError(requestError.message || '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
            <input type="text" placeholder='아이디' autoComplete="username" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
            <input type="password" placeholder='비밀번호' autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p role="alert" className="login-error">{error}</p>}
          <div className='login-button'>
            <button className='lets-login' type="submit" disabled={submitting}>{submitting ? '로그인 중...' : '로그인'}</button>
          </div>
        </form>
        <div className='ifyou-not'>
          <p>계정이 없으시다면? <span className='lets-signup' onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>회원가입 하러가기</span></p>
        </div>
      </div>
      <div className="login-right">
        <img src={gotripbackground} alt="background" className='gotrip-background'/>
      </div>
    </div>
  );
}

export default IsLogin;
