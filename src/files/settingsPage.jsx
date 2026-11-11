import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { clearSession, getLoginId, getToken } from '../api/session';
import penIcon from '../icons/gotrip-pen.png';
import { deleteAccount, fetchAccountDetails, profileImageSource, updateNickname, updateProfileImage } from '../services/profileApi';
import defaultProfile from '../images/profile.jpg';
import '../styles/settingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, setProfile } = useOutletContext();
  const [email, setEmail] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [nickname, setNickname] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const photoInput = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const signedIn = Boolean(getToken());
  const loginId = getLoginId();

  async function submitAccountChange(action, success) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ text: success });
    } catch (error) {
      setMessage({ text: error.message, error: true, account: !success });
    } finally {
      setBusy(false);
    }
  }

  function saveProfile(event) {
    event.preventDefault();
    const value = nickname?.trim();
    submitAccountChange(async () => {
      if (value && value !== profile?.nickname) {
        const updated = await updateNickname(value);
        setProfile((current) => ({ ...current, ...updated, nickname: updated?.nickname ?? value }));
        setNickname(null);
      }
      if (photo) {
        const updated = await updateProfileImage(photo);
        setProfile((current) => ({ ...current, ...updated }));
        setPhoto(null);
        photoInput.current.value = '';
      }
    }, '프로필을 저장했습니다.');
  }

  function withdraw() {
    if (!window.confirm('회원탈퇴 후에는 계정을 복구할 수 없습니다. 탈퇴하시겠습니까?')) return;
    submitAccountChange(async () => {
      await deleteAccount();
      logOut();
    });
  }

  async function toggleEmail() {
    if (email) {
      setEmail(null);
      return;
    }

    setEmailLoading(true);
    setEmailError(false);
    try {
      const details = await fetchAccountDetails();
      if (details?.email) setEmail(details.email);
      else setEmailError(true);
    } catch {
      setEmailError(true);
    } finally {
      setEmailLoading(false);
    }
  }

  function logOut() {
    clearSession();
    navigate('/islogin', { replace: true });
  }

  return (
    <main className="settings-page">
      <div className="settings-card">
        <section className="settings-section">
          <h3>프로필</h3>
          <p className="settings-description">사이드바에 표시되는 닉네임과 사진을 변경하세요.</p>
          {signedIn ? (
            <form onSubmit={saveProfile}>
              <fieldset className="settings-profile" disabled={busy}>
                <div className="settings-photo-row">
                  <button className="settings-avatar-button" type="button" aria-label="프로필 사진 바꾸기" onClick={() => photoInput.current.click()}>
                    <img className="settings-profile-image" src={(photo && preview) || profileImageSource(profile?.profileImageUrl) || defaultProfile} alt="" />
                    <span className="settings-avatar-overlay"><img src={penIcon} alt="" /></span>
                  </button>
                  <input ref={photoInput} type="file" accept="image/*" hidden onChange={(event) => setPhoto(event.target.files[0] ?? null)} />
                </div>
                <label className="settings-field">
                  닉네임
                  <input type="text" value={nickname ?? profile?.nickname ?? ''} onChange={(event) => setNickname(event.target.value)} />
                </label>
                <button className="settings-save" type="submit" disabled={!photo && (!nickname?.trim() || nickname.trim() === profile?.nickname)}>프로필 저장</button>
              </fieldset>
            </form>
          ) : <p className="settings-description">로그인 후 프로필을 변경할 수 있습니다.</p>}
          {busy && <p className="settings-description" role="status">처리 중입니다.</p>}
          {message && !message.account && <p className="settings-description" role={message.error ? 'alert' : 'status'}>{message.text}</p>}
        </section>
        <section className="settings-section">
          <h3>계정 정보</h3>
          {signedIn ? (
            <>
              <dl className="settings-account-details">
                <div className="settings-account-row">
                  <dt>아이디</dt>
                  <dd>{loginId || profile?.loginId}</dd>
                </div>
                <div className="settings-account-row">
                  <dt>이메일</dt>
                  <dd>
                    <span aria-live="polite">{email || '••••••••'}</span>
                    <button type="button" onClick={toggleEmail} disabled={busy || emailLoading}>
                      {emailLoading ? '조회 중…' : email ? '숨기기' : '보기'}
                    </button>
                  </dd>
                </div>
              </dl>
              {emailError && <p className="settings-description" role="status">이메일을 불러오지 못했습니다.</p>}
              <fieldset className="settings-actions" disabled={busy}>
                <div className="settings-action-row">
                  <div>
                    <h4>로그아웃</h4>
                    <p>이 브라우저에서 로그아웃합니다.</p>
                  </div>
                  <button type="button" onClick={logOut}>로그아웃</button>
                </div>
                <div className="settings-action-row">
                  <div>
                    <h4>회원탈퇴</h4>
                    <p>계정을 영구적으로 삭제합니다.</p>
                  </div>
                  <button type="button" className="settings-withdraw" onClick={withdraw}>회원탈퇴</button>
                </div>
              </fieldset>
            </>
          ) : <p className="settings-description">로그인 후 계정 설정을 이용할 수 있습니다.</p>}
          {message?.account && <p className="settings-description" role={message.error ? 'alert' : 'status'}>{message.text}</p>}
        </section>
      </div>
    </main>
  );
}
