import { useState } from 'react';
import gotriplogo from '../images/gotrip-logo.png';
import gotripjoin from '../images/gotrip-join.jpeg';
import gotripcheck from '../images/gotrip-check.png';
import { useNavigate } from 'react-router-dom';
import '../styles/signUp.css';
import { readSignupDraft, updateSignupDraft } from '../services/signupDraft';

function SignUp() {
  const navigate = useNavigate();
  const draft = readSignupDraft();
  const [loginId, setLoginId] = useState(draft.loginId || '');
  const [password, setPassword] = useState(draft.password || '');
  const [passwordConfirm, setPasswordConfirm] = useState(draft.passwordConfirm || '');
  const [error, setError] = useState('');
  const passwordsMatch = password === passwordConfirm;
  const passwordRules = [
    { label: '8자 이상, 20자 이하', valid: password.length >= 8 && password.length <= 20 },
    { label: '대소문자, 숫자, 특수문자 포함', valid: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password) },
    { label: '3자 이상 동일 문자/숫자 연속 사용 금지', valid: !/(.)\1\1/i.test(password) },
  ];

  function next(event) {
    event.preventDefault();
    const enteredPassword = event.currentTarget.querySelector('#signup-password')?.value ?? password;
    const confirmedPassword = event.currentTarget.querySelector('#signup-password-confirm')?.value ?? passwordConfirm;
    const validPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/.test(password)
      && !/(.)\1\1/i.test(password);
    if (!loginId.trim()) return setError('아이디를 입력해주세요.');
    if (!validPassword) return setError('비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 포함하고 같은 문자를 3번 연속 사용할 수 없습니다.');
    if (enteredPassword !== confirmedPassword) return setError('비밀번호가 동일하지 않습니다.');
    setError('');
    updateSignupDraft({ loginId: loginId.trim(), password: enteredPassword, passwordConfirm: confirmedPassword });
    navigate('/signup/step2');
  }

  return (
    <div className='join-cont'>
      <h1>회원 정보를 입력해주세요.</h1>
      <div className='card-wap'>
        <img className='gotrip-join' src={gotripjoin} alt="join-image" />
        <form className='card-from' onSubmit={next}>
          <img className='gotrip-logo' src={gotriplogo} alt="gotrip-logo" />
          <label htmlFor="signup-id">아이디</label>
          <input id="signup-id" type="text" autoComplete="username" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
          <label htmlFor="signup-password">비밀번호</label>
          <input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="password-rules" aria-live="polite">
            {passwordRules.map((rule) => (
              <ul key={rule.label} className={password ? (rule.valid ? 'rule-valid' : 'rule-invalid') : 'rule-idle'}>
                <img className='check' src={gotripcheck} alt="" />{rule.label}
              </ul>
            ))}
          </div>
          <label htmlFor="signup-password-confirm">비밀번호 확인</label>
          <input id="signup-password-confirm" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
          {passwordConfirm && !passwordsMatch && <p role="alert" className="signup-error password-mismatch">비밀번호가 동일하지 않습니다.</p>}
          {error && <p role="alert" className="signup-error">{error}</p>}
          <button className='Next-button' type="submit">다음</button>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
