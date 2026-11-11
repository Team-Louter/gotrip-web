import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLoginId, getToken } from '../api/session.js';
import { createFriendsMockStore, getFriendsMockStorageKey, mockFriendCandidates } from '../data/friendsMockStore.js';
import { friendshipApi } from '../services/friendshipApi.js';
import { matchesMember, memberApi } from '../services/memberApi.js';
import '../styles/friendsPage.css';

function decorateRelationship(relationship, membersById) {
  const member = membersById.get(relationship.memberId);
  return {
    ...relationship,
    id: relationship.friendshipId,
    loginId: member?.loginId ?? `member${relationship.memberId}`,
    name: relationship.nickname || member?.name || `회원 ${relationship.memberId}`,
    isMock: false,
  };
}

function FriendsPage() {
  const storageKey = getFriendsMockStorageKey();
  const mockStore = useMemo(() => createFriendsMockStore({ storageKey }), [storageKey]);
  const [mockState, setMockState] = useState(() => mockStore.read());
  const [serverData, setServerData] = useState({ members: [], friends: [], incomingRequests: [], sentRequests: [] });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState(null);
  const noticeSequence = useRef(0);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => setMockState(mockStore.read()), [mockStore]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    Promise.all([
      memberApi.getMembers({ excludeSelf: false, signal: controller.signal }),
      friendshipApi.getFriends({ signal: controller.signal }),
      friendshipApi.getReceivedRequests({ signal: controller.signal }),
      friendshipApi.getSentRequests({ signal: controller.signal }),
    ]).then(([members, friends, incomingRequests, sentRequests]) => {
      if (controller.signal.aborted) return;
      const membersById = new Map(members.filter((member) => member.id != null).map((member) => [member.id, member]));
      setServerData({
        members,
        friends: friends.map((item) => decorateRelationship(item, membersById)),
        incomingRequests: incomingRequests.map((item) => decorateRelationship(item, membersById)),
        sentRequests: sentRequests.map((item) => decorateRelationship(item, membersById)),
      });
      setStatus('ready');
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setError(reason);
      setStatus('error');
    });

    return () => controller.abort();
  }, [retry]);

  const serverLoginIds = new Set(serverData.friends.map((friend) => friend.loginId));
  const friends = [
    ...serverData.friends,
    ...mockState.friends.filter((friend) => !serverLoginIds.has(friend.loginId)),
  ];
  const visibleFriends = friends.filter((friend) => matchesMember(friend, query));
  const incomingRequests = [...serverData.incomingRequests, ...mockState.incomingRequests];
  const sentRequests = [...serverData.sentRequests, ...mockState.sentRequests];
  const serverMembersByLoginId = new Map(serverData.members.map((member) => [member.loginId, member]));
  const candidates = [
    ...serverData.members.filter((member) => member.loginId !== getLoginId()),
    ...mockFriendCandidates.filter((candidate) => !serverMembersByLoginId.has(candidate.loginId)),
  ];
  const visibleCandidates = query.trim()
    ? candidates.filter((member) => matchesMember(member, query)
      && !friends.some((friend) => friend.loginId === member.loginId)
      && !incomingRequests.some((request) => request.loginId === member.loginId)
      && !sentRequests.some((request) => request.loginId === member.loginId))
    : [];

  function showNotice(message) {
    noticeSequence.current += 1;
    setNotice({ id: noticeSequence.current, message });
  }

  async function performServerAction(action, successMessage) {
    setBusy(true);
    setActionError('');
    setNotice(null);
    try {
      await action();
      showNotice(successMessage);
      setRetry((value) => value + 1);
    } catch (reason) {
      setActionError(reason.message || '요청을 처리하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  function deleteFriend(friend) {
    if (friend.isMock) {
      setMockState(mockStore.removeFriend(friend.loginId));
      showNotice(`${friend.name}을(를) 친구 목록에서 삭제했어요.`);
      return;
    }
    performServerAction(() => friendshipApi.deleteFriend(friend.friendshipId), `${friend.name}을(를) 친구 목록에서 삭제했어요.`);
  }

  function sendRequest(member) {
    if (member.isMock) {
      setMockState(mockStore.sendRequest(member));
      showNotice('친구 요청을 보냈어요!');
      return;
    }
    performServerAction(() => friendshipApi.sendFriendRequest(member.id), '친구 요청을 보냈어요!');
  }

  function acceptRequest(request) {
    if (request.isMock) {
      setMockState(mockStore.acceptRequest(request.id));
      showNotice(`${request.name}의 친구 요청을 수락했어요.`);
      return;
    }
    performServerAction(() => friendshipApi.acceptFriendRequest(request.friendshipId), `${request.name}의 친구 요청을 수락했어요.`);
  }

  function rejectRequest(request) {
    if (request.isMock) {
      setMockState(mockStore.rejectRequest(request.id));
      showNotice(`${request.name}의 친구 요청을 거절했어요.`);
      return;
    }
    performServerAction(() => friendshipApi.rejectFriendRequest(request.friendshipId), `${request.name}의 친구 요청을 거절했어요.`);
  }

  function cancelRequest(request) {
    if (request.isMock) {
      setMockState(mockStore.cancelSentRequest(request.id));
      showNotice(`${request.name}에게 보낸 친구 요청을 취소했어요.`);
      return;
    }
    performServerAction(() => friendshipApi.cancelFriendRequest(request.friendshipId), `${request.name}에게 보낸 친구 요청을 취소했어요.`);
  }

  return (
    <main className="friends-page">
      {notice && <div className="friends-toast" key={notice.id} role="status" aria-live="polite">{notice.message}</div>}
      <section className="friends-card friends-directory" aria-labelledby="friends-title">
        <header className="friends-header">
          <div>
            <h1 id="friends-title">친구 목록</h1>
            <p>여행을 함께할 사람을 찾아보세요.</p>
          </div>
        </header>

        <label className="friends-search-label" htmlFor="friends-search">친구 검색</label>
        <input
          id="friends-search"
          className="friends-search"
          type="search"
          placeholder="닉네임 또는 아이디로 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {actionError && <p className="friends-action-error" role="alert">{actionError}</p>}

        <div className="friends-list-region" aria-busy={status === 'loading'}>
          <section className="friends-list-section" aria-labelledby="my-friends-title">
            <div className="friends-count-row">
              <h2 id="my-friends-title">내 친구</h2>
              <span className="friends-count" aria-live="polite">{visibleFriends.length}명</span>
            </div>

            {visibleFriends.length === 0 && <p className="friends-empty" role="status">{query.trim() ? '친구 목록에서 검색 결과가 없어요.' : '아직 친구가 없어요.'}</p>}
            {visibleFriends.length > 0 && (
              <ul className="friends-list" aria-label="내 친구 목록">
                {visibleFriends.map((friend) => (
                  <li className="friend-row" key={friend.friendshipId ?? friend.id ?? friend.loginId}>
                    <span className="friend-avatar" aria-hidden="true">{friend.name.slice(0, 1)}</span>
                    <div className="friend-identity">
                      <strong>{friend.name}</strong>
                      <span>@{friend.loginId}{friend.isMock && <small className="friend-mock-badge">임시</small>}</span>
                    </div>
                    <button className="friend-delete-button" type="button" disabled={busy}
                      aria-label={`${friend.name} 친구 삭제`} onClick={() => deleteFriend(friend)}>친구 삭제</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {query.trim() && (
            <section className="friends-discover-section" aria-labelledby="friend-search-results-title">
              <div className="friends-count-row">
                <h2 id="friend-search-results-title">검색 결과</h2>
              </div>
              {visibleCandidates.length === 0 ? <p className="friends-empty" role="status">추가할 수 있는 사용자가 없어요.</p> : (
                <ul className="friends-list" aria-label="친구 추가 검색 결과">
                  {visibleCandidates.map((member) => (
                    <li className="friend-row" key={member.id ?? member.loginId}>
                      <span className="friend-avatar" aria-hidden="true">{member.name.slice(0, 1)}</span>
                      <div className="friend-identity">
                        <strong>{member.name}</strong>
                        <span>@{member.loginId}{member.isMock && <small className="friend-mock-badge">임시</small>}</span>
                      </div>
                      <button className="friend-add-button" type="button" disabled={busy || member.id == null}
                        onClick={() => sendRequest(member)}>친구 추가</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {status === 'loading' && <p className="friends-feedback" role="status">친구 정보를 불러오는 중이에요.</p>}
          {status === 'error' && (
            <div className="friends-feedback" role="alert">
              <p>{error?.message || '친구 정보를 불러오지 못했어요.'}</p>
              {!getToken()
                ? <Link to="/islogin" state={{ from: '/friends' }}>로그인하기</Link>
                : <button type="button" disabled={busy} onClick={() => setRetry((value) => value + 1)}>다시 시도</button>}
            </div>
          )}
        </div>
      </section>

      <aside className="friends-card friends-requests" aria-labelledby="friend-requests-title">
        <header className="friends-requests-header">
          <h2 id="friend-requests-title">친구 요청</h2>
          <p>받은 요청을 확인하고 보낸 요청을 살펴보세요.</p>
        </header>

        <section className="friends-request-section" aria-labelledby="incoming-requests-title">
          <div className="friends-request-heading">
            <h3 id="incoming-requests-title">받은 요청</h3>
            <span>{incomingRequests.length}</span>
          </div>
          {incomingRequests.length === 0 ? <p className="friends-request-empty">받은 친구 요청이 없어요.</p> : (
            <ul className="friends-request-list" aria-label="받은 친구 요청">
              {incomingRequests.map((request) => (
                <li className="friends-request-row" key={request.friendshipId ?? request.id}>
                  <span className="friend-avatar" aria-hidden="true">{request.name.slice(0, 1)}</span>
                  <div className="friend-identity">
                    <strong>{request.name}</strong>
                    <span>@{request.loginId}{request.isMock && <small className="friend-mock-badge">임시</small>}</span>
                  </div>
                  <div className="friends-request-actions">
                    <button type="button" disabled={busy} className="friend-accept-button" onClick={() => acceptRequest(request)}>수락</button>
                    <button type="button" disabled={busy} className="friend-reject-button" onClick={() => rejectRequest(request)}>거절</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="friends-request-section friends-sent-section" aria-labelledby="sent-requests-title">
          <div className="friends-request-heading">
            <h3 id="sent-requests-title">보낸 요청</h3>
            <span>{sentRequests.length}</span>
          </div>
          {sentRequests.length === 0 ? <p className="friends-request-empty">보낸 친구 요청이 없어요.</p> : (
            <ul className="friends-request-list" aria-label="보낸 친구 요청">
              {sentRequests.map((request) => (
                <li className="friends-request-row" key={request.friendshipId ?? request.id}>
                  <span className="friend-avatar" aria-hidden="true">{request.name.slice(0, 1)}</span>
                  <div className="friend-identity">
                    <strong>{request.name}</strong>
                    <span>@{request.loginId} · 요청 보냄</span>
                  </div>
                  <button type="button" className="friend-cancel-button" disabled={busy} onClick={() => cancelRequest(request)}>취소</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </main>
  );
}

export default FriendsPage;
