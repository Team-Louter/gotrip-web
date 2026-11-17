import Toast, { useToast } from '../components/Toast';
import { useState } from 'react';
import gotriplogo from '../images/gotrip-logo.png';
import gotripjoin from '../images/gotrip-join.jpeg';
import { useNavigate } from 'react-router-dom';
import '../styles/signUp.css';
import { readSignupDraft, updateSignupDraft } from '../services/signupDraft';

function SignUp2() {
  const navigate = useNavigate();
  const draft = readSignupDraft();
  const [birthDate, setBirthDate] = useState(draft.birthDate || '');
  const [email, setEmail] = useState(draft.email || '');
  const [nickname, setNickname] = useState(draft.nickname || '');
  const [notice, notify] = useToast();

  function next(event) {
    event.preventDefault();
    if (!draft.loginId || !draft.password) {
      notify('첫 번째 단계의 계정 정보를 다시 입력해주세요.');
      return;
    }
    if (!/^\d{8}$/.test(birthDate.replaceAll('-', '').replaceAll('/', ''))) {
      notify('생년월일을 YYYYMMDD 형식으로 입력해주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return notify('올바른 이메일 주소를 입력해주세요.');
    if (!nickname.trim()) return notify('닉네임을 입력해주세요.');
    const normalizedBirthDate = birthDate.replaceAll('-', '').replaceAll('/', '');
    const year = Number(normalizedBirthDate.slice(0, 4));
    const month = Number(normalizedBirthDate.slice(4, 6));
    const day = Number(normalizedBirthDate.slice(6, 8));
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return notify('실제 날짜를 YYYYMMDD 형식으로 입력해주세요.');
    }
    updateSignupDraft({ birthDate: normalizedBirthDate, email: email.trim(), nickname: nickname.trim() });
    navigate('/signup/terms');
  }

  return (
    <div className='join-cont'>
      <Toast notice={notice} />
      <h1>회원 정보를 입력해주세요.</h1>
      <div className='card-wap'>
        <img className='gotrip-join' src={gotripjoin} alt="join-image" />
        <form className='card-from' onSubmit={next} noValidate>
          <img className='gotrip-logo' src={gotriplogo} alt="gotrip-logo" />
          <label htmlFor="signup-birthdate">생년월일</label>
          <input id="signup-birthdate" type="text" inputMode="numeric" placeholder='YYYYMMDD' value={birthDate} onInput={(e) => setBirthDate(e.target.value)} required />
          <label htmlFor="signup-email">이메일 입력</label>
          <input id="signup-email" type="email" placeholder='@포함' autoComplete="email" value={email} onInput={(e) => setEmail(e.target.value)} required />
          <label htmlFor="signup-nickname">닉네임</label>
          <input id="signup-nickname" type="text" value={nickname} onInput={(e) => setNickname(e.target.value)} required />
          <button className='Next-button' type="submit" disabled={!birthDate.trim() || !email.trim() || !nickname.trim()}>다음</button>
        </form>
      </div>
    </div>
  );
}

export default SignUp2;
