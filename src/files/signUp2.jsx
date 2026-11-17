import { useState } from 'react';
import gotriplogo from '../images/gotrip-logo.png';
import gotripjoin from '../images/gotrip-join.jpeg';
import gotripjoinUpscaled from '../images/gotrip-join-upscaled.jpeg';
import { Navigate, useNavigate } from 'react-router-dom';
import '../styles/signUp.css';
import { readSignupDraft, updateSignupDraft } from '../services/signupDraft';
import { isValidSignupBirthDate, isValidSignupEmail, isValidSignupPassword } from '../data/signupValidation';
import Toast from '../components/Toast';

function SignUp2() {
  const navigate = useNavigate();
  const draft = readSignupDraft();
  const [birthDate, setBirthDate] = useState(draft.birthDate || '');
  const [email, setEmail] = useState(draft.email || '');
  const [nickname, setNickname] = useState(draft.nickname || '');
  const [error, setError] = useState('');
  const validAccount = Boolean(draft.loginId?.trim() && isValidSignupPassword(draft.password) && draft.password === draft.passwordConfirm);
  const canContinue = isValidSignupBirthDate(birthDate) && isValidSignupEmail(email) && Boolean(nickname.trim());

  function next(event) {
    event.preventDefault();
    if (!draft.loginId || !draft.password) {
      setError('첫 번째 단계의 계정 정보를 다시 입력해주세요.');
      return;
    }
    if (!isValidSignupBirthDate(birthDate)) {
      setError('실제 날짜를 YYYYMMDD 형식으로 입력해주세요.');
      return;
    }
    if (!isValidSignupEmail(email)) return setError('올바른 이메일 주소를 입력해주세요.');
    if (!nickname.trim()) return setError('닉네임을 입력해주세요.');
    const normalizedBirthDate = birthDate.trim().replace(/[-/]/g, '');
    updateSignupDraft({ birthDate: normalizedBirthDate, email: email.trim(), nickname: nickname.trim() });
    navigate('/registration/terms');
  }

  if (!validAccount) return <Navigate to="/registration" replace />;

  return (
    <div className='join-cont'>
      <h1>회원 정보를 입력해주세요.</h1>
      <div className='card-wap'>
        <img className='gotrip-join' src={gotripjoin} srcSet={`${gotripjoin} 3024w, ${gotripjoinUpscaled} 6048w`} sizes="(max-width: 800px) 1px, 500px" alt="" decoding="async" />
        <form className='card-from' onSubmit={next}>
          <img className='gotrip-logo' src={gotriplogo} alt="gotrip-logo" />
          <label htmlFor="signup-birthdate">생년월일</label>
          <input id="signup-birthdate" type="text" inputMode="numeric" placeholder='YYYYMMDD' value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
          <label htmlFor="signup-email">이메일 입력</label>
          <input id="signup-email" type="email" placeholder='@포함' autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="signup-nickname">닉네임</label>
          <input id="signup-nickname" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
          <button className='Next-button' type="submit" disabled={!canContinue}>다음</button>
        </form>
      </div>
      <Toast key={error} message={error} onClose={setError} />
    </div>
  );
}

export default SignUp2;
