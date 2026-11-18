import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAccountId, getLoginId, getToken } from '../api/session.js';
import { friendshipApi } from '../services/friendshipApi.js';
import { matchesMember, memberApi } from '../services/memberApi.js';
import { showErrorToast, showSuccessToast } from '../components/AppToasts';
import { friendGroupsStorageKey, readFriendGroups } from '../data/friendGroups.js';
import FriendGroupDialog from '../components/FriendGroupDialog.jsx';
import ProfileAvatar from '../components/ProfileAvatar.jsx';
import memoIcon from '../icons/memoIcon.png';
import '../styles/friendsPage.css';

function decorateRelationship(relationship, membersById) {
  const member = membersById.get(relationship.memberId);
  return {
    ...relationship,
    id: relationship.friendshipId,
    loginId: member?.loginId ?? `member${relationship.memberId}`,
    name: relationship.nickname || member?.name || `회원 ${relationship.memberId}`,
  };
}

function FriendsPage() {
  const location = useLocation();
  const groupStorageKey = friendGroupsStorageKey();
  const [serverData, setServerData] = useState({ members: [], friends: [], incomingRequests: [], sentRequests: [] });
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState(() => location.state?.initialTab === 'groups' ? 'groups' : 'friends');
  const [groups, setGroups] = useState(readFriendGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupDialog, setGroupDialog] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

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

  const friends = serverData.friends;
  const visibleFriends = friends.filter((friend) => matchesMember(friend, query));
  const incomingRequests = serverData.incomingRequests;
  const sentRequests = serverData.sentRequests;
  const candidates = serverData.members.filter((member) => member.loginId !== getLoginId());
  const visibleCandidates = query.trim()
    ? candidates.filter((member) => matchesMember(member, query)
      && !friends.some((friend) => friend.loginId === member.loginId)
      && !incomingRequests.some((request) => request.loginId === member.loginId)
      && !sentRequests.some((request) => request.loginId === member.loginId))
    : [];
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const selectedGroupFriends = selectedGroup
    ? friends.filter((friend) => selectedGroup.friendIds.includes(String(friend.memberId ?? friend.id)))
    : [];

  async function performServerAction(action, successMessage) {
    setBusy(true);
    setActionError('');
    try {
      await action();
      showSuccessToast(successMessage);
      setRetry((value) => value + 1);
    } catch (reason) {
      setActionError(reason.message || '요청을 처리하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  function deleteFriend(friend) {
    performServerAction(() => friendshipApi.deleteFriend(friend.friendshipId), `${friend.name}을(를) 친구 목록에서 삭제했어요.`);
  }

  function sendRequest(member) {
    performServerAction(() => friendshipApi.sendFriendRequest(member.id), '친구 요청을 보냈어요!');
  }

  function acceptRequest(request) {
    performServerAction(() => friendshipApi.acceptFriendRequest(request.friendshipId), `${request.name}의 친구 요청을 수락했어요.`);
  }

  function rejectRequest(request) {
    performServerAction(() => friendshipApi.rejectFriendRequest(request.friendshipId), `${request.name}의 친구 요청을 거절했어요.`);
  }

  function cancelRequest(request) {
    performServerAction(() => friendshipApi.cancelFriendRequest(request.friendshipId), `${request.name}에게 보낸 친구 요청을 취소했어요.`);
  }

  function saveGroup(group) {
    const next = groups.some((item) => item.id === group.id)
      ? groups.map((item) => item.id === group.id ? group : item)
      : [...groups, group];
    try {
      localStorage.setItem(groupStorageKey, JSON.stringify(next));
      setGroups(next);
      setSelectedGroupId(group.id);
      setGroupDialog(null);
      showSuccessToast(groups.some((item) => item.id === group.id) ? '그룹을 수정했습니다.' : '그룹을 추가했습니다.');
    } catch {
      showErrorToast('그룹을 저장하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  function deleteGroup(groupId) {
    const next = groups.filter((group) => group.id !== groupId);
    try {
      localStorage.setItem(groupStorageKey, JSON.stringify(next));
      setGroups(next);
      if (selectedGroupId === groupId) setSelectedGroupId(next[0]?.id ?? null);
      setGroupDialog(null);
      showSuccessToast('그룹을 삭제했습니다.');
    } catch {
      showErrorToast('그룹을 삭제하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  function closeGroupDialog() {
    showSuccessToast(groupDialog?.mode === 'create' ? '그룹 추가를 취소했습니다.' : '그룹 수정을 취소했습니다.');
    setGroupDialog(null);
  }

  return (
    <main className="friends-page">
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

        <div className="friends-subnav" role="tablist" aria-label="친구 기능">
          <button type="button" id="friends-tab" role="tab" aria-controls="friends-tab-panel" aria-selected={activeView === 'friends'} className={activeView === 'friends' ? 'is-active' : ''} onClick={() => setActiveView('friends')}>친구</button>
          <button type="button" id="groups-tab" role="tab" aria-controls="groups-tab-panel" aria-selected={activeView === 'groups'} className={activeView === 'groups' ? 'is-active' : ''} onClick={() => setActiveView('groups')}>그룹</button>
        </div>

        {actionError && <p className="friends-action-error" role="alert">{actionError}</p>}

        {activeView === 'friends' ? <div id="friends-tab-panel" role="tabpanel" aria-labelledby="friends-tab" className="friends-list-region" aria-busy={status === 'loading'}>
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
                    <ProfileAvatar className="friend-avatar" imageUrl={friend.profileImageUrl} />
                    <div className="friend-identity">
                      <strong>{friend.name}</strong>
                      <span>@{friend.loginId}</span>
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
                      <ProfileAvatar className="friend-avatar" imageUrl={member.profileImageUrl} />
                      <div className="friend-identity">
                        <strong>{member.name}</strong>
                        <span>@{member.loginId}</span>
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
                ? <Link to="/login" state={{ from: '/friends' }}>로그인하기</Link>
                : <button type="button" disabled={busy} onClick={() => setRetry((value) => value + 1)}>다시 시도</button>}
            </div>
          )}
        </div> : <div id="groups-tab-panel" role="tabpanel" aria-labelledby="groups-tab" className="friend-groups-view" aria-busy={status === 'loading'}>
          <div className="friend-groups-heading">
            <h2>그룹</h2>
            <button type="button" className="friend-group-add" aria-label="그룹 추가" title="그룹 추가" onClick={() => setGroupDialog({ mode: 'create' })}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          {status === 'loading' ? <p className="friends-feedback" role="status">친구 정보를 불러오는 중이에요.</p> : status === 'error' ? <div className="friends-feedback" role="alert"><p>{error?.message || '친구 정보를 불러오지 못했어요.'}</p>{!getToken() ? <Link to="/login" state={{ from: '/friends' }}>로그인하기</Link> : <button type="button" disabled={busy} onClick={() => setRetry((value) => value + 1)}>다시 시도</button>}</div> : <>
            {groups.length === 0 ? <p className="friends-empty">아직 그룹이 없어요. 그룹을 추가해 보세요.</p> : <div className="friend-groups-layout">
              <ul className="friend-groups-list" aria-label="친구 그룹 목록">
                {groups.filter((group) => !query.trim() || group.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map((group) => <li key={group.id}>
                  <button type="button" className={`friend-group-select${selectedGroup?.id === group.id ? ' is-selected' : ''}`} onClick={() => setSelectedGroupId(group.id)} aria-pressed={selectedGroup?.id === group.id}>
                    <strong>{group.name}</strong><span>{group.friendIds.length}명</span>
                  </button>
                  <button type="button" className="friend-group-edit" aria-label={`${group.name} 그룹 수정`} title="수정" onClick={() => setGroupDialog(group)}><img src={memoIcon} alt="" /></button>
                </li>)}
              </ul>
              <section className="friend-group-detail" aria-label={selectedGroup ? `${selectedGroup.name} 그룹 친구` : '그룹 상세'}>
                {selectedGroup ? <>
                  <div className="friend-group-detail-heading"><h3>{selectedGroup.name}</h3><span>{selectedGroupFriends.length}명</span></div>
                  {selectedGroupFriends.length ? <ul className="friends-list" aria-label={`${selectedGroup.name} 친구`}>
                    {selectedGroupFriends.map((friend) => <li className="friend-row" key={friend.friendshipId ?? friend.id}>
                      <ProfileAvatar className="friend-avatar" imageUrl={friend.profileImageUrl} />
                      <div className="friend-identity"><strong>{friend.name}</strong><span>@{friend.loginId}</span></div>
                    </li>)}
                  </ul> : <p className="friends-empty">이 그룹에 등록된 친구가 없어요.</p>}
                </> : <p className="friends-empty">조회할 그룹을 선택해 주세요.</p>}
              </section>
            </div>}
          </>}
        </div>}
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
                  <ProfileAvatar className="friend-avatar" imageUrl={request.profileImageUrl} />
                  <div className="friend-identity">
                    <strong>{request.name}</strong>
                    <span>@{request.loginId}</span>
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
                  <ProfileAvatar className="friend-avatar" imageUrl={request.profileImageUrl} />
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
      {groupDialog && <FriendGroupDialog
        group={groupDialog.mode === 'create' ? null : groupDialog}
        friends={friends}
        onClose={closeGroupDialog}
        onSave={saveGroup}
        onDelete={deleteGroup}
      />}
    </main>
  );
}

export default FriendsPage;
