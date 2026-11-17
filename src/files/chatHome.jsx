import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gotripplane from '../icons/gotrip-plane.png';
import dotsIcon from '../icons/gotrip-dots.png';
import cameraIcon from '../icons/gotrip-camera.png';
import clipIcon from '../icons/gotrip-clip.png';
import { chatApi } from '../services/chatApi';
import { getToken } from '../api/session';
import { showErrorToast, showSuccessToast } from '../components/AppToasts';
import { MESSAGE_PAGE_SIZE } from '../services/serverChatApi';
import { chatCounterpartProfileImage, DEFAULT_PROFILE_IMAGE, profileImageSource } from '../services/profileApi.js';
import { REACTION_EMOJIS, formatReplyContent, httpUrl, messagePreview, validateImages } from '../data/chatMessages';
import '../styles/chatMessages.css';

function resizeComposerTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  const styles = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
  const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
  const maxHeight = lineHeight * 4 + verticalPadding;
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function formatChatTime(value) {
  if (!value) return '';
  const time = String(value).trim();
  if (/^(오전|오후)\s/.test(time)) return time;

  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour <= 23 && minute <= 59) {
      return `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`;
    }
    return time;
  }

  const date = new Date(time);
  return Number.isNaN(date.valueOf())
    ? time
    : new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

function sharesMessageTimeGroup(message, nextMessage) {
  if (!nextMessage || formatChatTime(message.time) !== formatChatTime(nextMessage.time)) return false;
  if (Boolean(message.mine) !== Boolean(nextMessage.mine)) return false;

  const messageSender = message.senderId ?? message.senderName;
  const nextSender = nextMessage.senderId ?? nextMessage.senderName;
  if (messageSender != null && nextSender != null && String(messageSender) !== String(nextSender)) return false;

  const messageDate = new Date(message.createdAt ?? '');
  const nextDate = new Date(nextMessage.createdAt ?? '');
  if (Number.isFinite(messageDate.valueOf()) && Number.isFinite(nextDate.valueOf())) {
    return messageDate.getFullYear() === nextDate.getFullYear()
      && messageDate.getMonth() === nextDate.getMonth()
      && messageDate.getDate() === nextDate.getDate();
  }
  return true;
}

function messageDayKey(message) {
  const date = new Date(message.createdAt ?? '');
  if (Number.isNaN(date.valueOf())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageDate(message) {
  const date = new Date(message.createdAt ?? '');
  if (Number.isNaN(date.valueOf())) return '';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function ChatHome({ room, onRoomUpdated, onRoomRemoved, syncError = '', onRetrySync }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [replyToId, setReplyToId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [roomEditOpen, setRoomEditOpen] = useState(false);
  const [roomNameDraft, setRoomNameDraft] = useState(room.name);
  const [roomActionError, setRoomActionError] = useState('');
  const [roomActionBusy, setRoomActionBusy] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const historyBusy = useRef(false);
  const historyController = useRef(null);
  const areaRef = useRef(null);
  const historyAnchor = useRef(null);
  const followLatest = useRef(true);
  const capabilities = room.capabilities ?? chatApi.capabilities;
  const messageLimit = room.maxMessageLength ?? chatApi.maxMessageLength;
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const endRef = useRef(null);
  const popoverRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const roomMenuRef = useRef(null);
  const roomMenuButtonRef = useRef(null);
  const roomEditDialogRef = useRef(null);
  const mutationBusy = useRef(false);
  const uploadBusy = useRef(false);
  const clientIdRef = useRef(null);
  const messageRefs = useRef(new Map());

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (historyAnchor.current && area) {
      area.scrollTop = historyAnchor.current.top + area.scrollHeight - historyAnchor.current.height;
      historyAnchor.current = null;
    } else if (followLatest.current) endRef.current?.scrollIntoView({ block: 'end' });
  }, [room.messages.length, room.hasOlderMessages]);
  useLayoutEffect(() => resizeComposerTextarea(textInputRef.current), [content]);
  useEffect(() => () => historyController.current?.abort(), []);

  async function loadOlder() {
    if (historyBusy.current || !room.messages.length) return;
    historyBusy.current = true; setLoadingOlder(true); setError('');
    const controller = new AbortController();
    historyController.current = controller;
    try {
      const messages = await chatApi.getMessages(room.id, { before: room.messages[0].id, signal: controller.signal });
      if (controller.signal.aborted) return;
      historyAnchor.current = { top: areaRef.current.scrollTop, height: areaRef.current.scrollHeight };
      onRoomUpdated({ ...room, messages, hasOlderMessages: messages.length === MESSAGE_PAGE_SIZE });
    } catch (reason) { if (!controller.signal.aborted) setError(reason.message); }
    finally { historyBusy.current = false; if (!controller.signal.aborted) setLoadingOlder(false); }
  }

  useEffect(() => {
    if (!menu) return;
    const closeOutside = (event) => {
      if (!popoverRef.current?.contains(event.target) && !event.target.closest('.message-toolbar')) setMenu(null);
    };
    const escape = (event) => {
      if (event.key === 'Escape') { setMenu(null); menuTriggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', escape); };
  }, [menu]);

  useEffect(() => {
    if (!roomMenuOpen) return undefined;
    const closeOutside = (event) => {
      if (!roomMenuRef.current?.contains(event.target)) setRoomMenuOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        setRoomMenuOpen(false);
        roomMenuButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', escape);
    };
  }, [roomMenuOpen]);

  useEffect(() => {
    if (!roomEditOpen) return undefined;
    const dialog = roomEditDialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [roomEditOpen]);

  async function mutate(operation) {
    if (mutationBusy.current) return false;
    mutationBusy.current = true; setBusy(true); setError('');
    try { onRoomUpdated(await operation()); return true; }
    catch (reason) { setError(reason.message || '변경 내용을 저장하지 못했어요.'); return false; }
    finally { mutationBusy.current = false; setBusy(false); }
  }

  function toggleMenu(message, type, trigger) {
    menuTriggerRef.current = trigger;
    setMenu((current) => current?.id === message.id && current.type === type ? null : { id: message.id, type });
  }

  function openRoomEdit() {
    setRoomMenuOpen(false);
    setRoomActionError('');
    setRoomNameDraft(room.name);
    setRoomEditOpen(true);
  }

  async function saveRoomName(event) {
    event.preventDefault();
    const name = roomNameDraft.trim();
    if (!name || name.length > 100) {
      setRoomActionError('채팅방 이름을 1~100자로 입력해 주세요.');
      return;
    }
    setRoomActionBusy(true);
    setRoomActionError('');
    try {
      const updatedRoom = await chatApi.updateChatRoom(room.id, { name });
      onRoomUpdated({ ...room, ...updatedRoom });
      setRoomEditOpen(false);
      showSuccessToast('채팅방 이름을 수정했습니다.');
    } catch (reason) {
      setRoomActionError(reason.message || '채팅방 이름을 수정하지 못했습니다.');
    } finally {
      setRoomActionBusy(false);
    }
  }

  async function removeOrLeaveRoom() {
    const isOwner = Boolean(room.isOwner);
    setRoomMenuOpen(false);
    if (!window.confirm(isOwner ? '채팅방과 모든 대화 내용을 삭제할까요?' : '이 채팅방에서 나갈까요?')) return;
    setRoomActionBusy(true);
    try {
      if (isOwner) await chatApi.deleteChatRoom(room.id);
      else await chatApi.leaveChatRoom(room.id);
      showSuccessToast(isOwner ? '채팅방을 삭제했습니다.' : '채팅방에서 나왔습니다.');
      onRoomRemoved?.(room.id);
    } catch (reason) {
      showErrorToast(reason.message || (isOwner ? '채팅방을 삭제하지 못했습니다.' : '채팅방에서 나가지 못했습니다.'));
    } finally {
      setRoomActionBusy(false);
    }
  }

  function startReply(message) {
    setReplyToId(message.id); setMenu(null); clientIdRef.current = null;
    textInputRef.current?.focus();
  }

  async function send(e) {
    e.preventDefault();
    if (mutationBusy.current || uploadBusy.current || (!content.trim() && !attachments.length)) return;
    const quotedReply = replyToId && !capabilities.replies && replyMessage
      ? formatReplyContent(replyMessage, content)
      : content;
    if (quotedReply.trim().length > messageLimit) {
      setError(`답장 인용을 포함해 ${messageLimit.toLocaleString()}자 이내로 입력해 주세요.`);
      return;
    }
    clientIdRef.current ||= crypto.randomUUID();
    const saved = await mutate(() => chatApi.sendMessage(room.id, {
      content: quotedReply,
      attachments,
      replyToId: capabilities.replies ? replyToId : null,
      clientId: clientIdRef.current,
    }));
    if (saved) { followLatest.current = true; endRef.current?.scrollIntoView({ block: 'end' }); setContent(''); setAttachments([]); setReplyToId(null); setLinkOpen(false); setLink(''); clientIdRef.current = null; textInputRef.current?.focus(); }
  }

  async function attachImages(e) {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length || uploadBusy.current || mutationBusy.current) return;
    try { validateImages(files, attachments.filter((item) => item.type === 'image')); }
    catch (reason) { setError(reason.message); return; }
    uploadBusy.current = true; setUploading(true); setError('');
    try {
      const images = await chatApi.uploadImages(files);
      setAttachments((current) => [...current, ...images]); clientIdRef.current = null;
    } catch (reason) { setError(reason.message || '이미지를 첨부하지 못했어요.'); }
    finally { uploadBusy.current = false; setUploading(false); }
  }

  function addLink() {
    if (busy || uploading) return;
    try {
      const url = httpUrl(link);
      if (attachments.some((item) => item.type === 'link' && item.url === url)) throw new Error('이미 첨부한 링크예요.');
      if (attachments.filter((item) => item.type === 'link').length >= 3) throw new Error('링크는 최대 3개까지 첨부할 수 있어요.');
      setAttachments((current) => [...current, { id: crypto.randomUUID(), type: 'link', url }]);
      setLink(''); setLinkOpen(false); setError(''); clientIdRef.current = null;
      textInputRef.current?.focus();
    } catch (reason) { setError(reason.message); }
  }

  async function copyMessage(message) {
    try {
      if (!navigator.clipboard) throw new Error();
      await navigator.clipboard.writeText([message.content, ...(message.attachments ?? []).map((item) => item.type === 'link' ? item.url : item.name)].filter(Boolean).join('\n'));
      setError('');
      showSuccessToast('복사되었습니다.');
    } catch { setError('복사하지 못했어요. 메시지를 선택해서 복사해 주세요.'); }
    setMenu(null);
  }

  async function toggleReaction(message, emoji) {
    setMenu(null);
    const active = !(message.reactions ?? []).find((item) => item.emoji === emoji)?.mine;
    await mutate(() => chatApi.setReaction(room.id, message.id, emoji, active));
  }

  const replyMessage = room.messages.find((message) => message.id === replyToId);

  return (
    <main className="chat-main" aria-label={`${room.name} 대화`}>
      <div className="room-header">
        <img className="room-profile" src={chatCounterpartProfileImage(room)} alt="" />
        <div><p className="room-name">{room.name}</p><p className="room-status">{room.membersKnown === false ? '여행 대화' : `${room.members.length + 1}명 · ${[...room.members.map((member) => member.name), '나'].join(', ')}`}</p></div>
        <div className="room-menu-wrap" ref={roomMenuRef}>
          <button ref={roomMenuButtonRef} className="room-menu-button" type="button" aria-label="채팅방 메뉴" aria-haspopup="menu" aria-expanded={roomMenuOpen} onClick={() => setRoomMenuOpen((open) => !open)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
          </button>
          {roomMenuOpen && <div className="room-menu-popover" role="menu" aria-label="채팅방 메뉴">
            {room.isOwner ? <>
              <button type="button" role="menuitem" onClick={openRoomEdit}>방 수정하기</button>
              <button type="button" role="menuitem" className="is-danger" onClick={removeOrLeaveRoom}>방 삭제하기</button>
            </> : <button type="button" role="menuitem" className="is-danger" onClick={removeOrLeaveRoom}>방 나가기</button>}
          </div>}
        </div>
      </div>
      {syncError && <div className="chat-sync-error" role="alert">{syncError} {!getToken() ? <Link to="/login" state={{ from: `/chat/rooms/${room.id}` }}>다시 로그인</Link> : <button type="button" onClick={onRetrySync}>다시 시도</button>}</div>}
      <div ref={areaRef} className="message-area" aria-label="대화 내용" onScroll={(event) => { const area = event.currentTarget; followLatest.current = area.scrollHeight - area.scrollTop - area.clientHeight < 100; }}>
        {room.hasOlderMessages && <button type="button" className="chat-load-older" disabled={loadingOlder} onClick={loadOlder}>{loadingOlder ? '불러오는 중…' : '이전 대화 불러오기'}</button>}
        {room.messages.length === 0 ? <p className="chat-conversation-empty">아직 메시지가 없습니다.</p> : room.messages.map((message, index) => {
          const original = room.messages.find((item) => item.id === message.replyToId);
          const replyPreview = message.replyPreview ?? (original ? { senderName: original.senderName, content: messagePreview(original) } : null);
          const isReply = Boolean(replyPreview && !message.deleted);
          const showTimestamp = !sharesMessageTimeGroup(message, room.messages[index + 1]);
          const dayKey = messageDayKey(message);
          const previousDayKey = index > 0 ? messageDayKey(room.messages[index - 1]) : null;
          const dateLabel = formatMessageDate(message);
          const showDateDivider = Boolean(dateLabel) && (index === 0 || dayKey !== previousDayKey);
          const openMenu = menu?.id === message.id;
          return (
            <Fragment key={message.id}>
            {showDateDivider && <div className="chat-date-divider" role="separator" aria-label={dateLabel}><span>{dateLabel}</span></div>}
            <article className={`${message.mine ? 'me-row' : 'msg-row'} chat-message-row`} aria-label={`메시지 ${message.id}`} tabIndex={-1}
              ref={(element) => { if (element) messageRefs.current.set(message.id, element); else messageRefs.current.delete(message.id); }}>
              {!message.mine && <img className="msg-profile" src={profileImageSource(message.senderProfileImageUrl || message.profileImageUrl) || DEFAULT_PROFILE_IMAGE} alt="" />}
              <div className="chat-message-content">
                {!message.mine && <p className="chat-sender-name">{message.senderName}</p>}
                {isReply && (message.replyToId ? <button type="button" className="message-original" aria-label="원본 메시지 보기" title={replyPreview.content} onClick={() => { const element = messageRefs.current.get(message.replyToId); element?.scrollIntoView({ block: 'center', behavior: 'smooth' }); element?.focus({ preventScroll: true }); }}>
                  <strong>{replyPreview.senderName || '원본 메시지'}</strong><span>{replyPreview.content}</span>
                </button> : <div className="message-original is-static" aria-label="답장한 원본 메시지">
                  <strong>{replyPreview.senderName || '원본 메시지'}</strong><span>{replyPreview.content}</span>
                </div>)}
                <div className={isReply ? 'message-reply-body' : undefined}>
                  {isReply && <svg className="message-reply-arrow" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 3v10a7 7 0 0 0 7 7h12m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                <div className={`${message.mine ? 'right-bubble' : 'left-bubble'} message-surface${message.deleted ? ' message-deleted' : ''}`} onClick={(event) => {
                  if (message.deleted || event.target.closest('a, button')) return;
                  if (window.getSelection()?.toString()) return;
                  menuTriggerRef.current = null;
                  setMenu((current) => current?.id === message.id && current.type === 'actions' ? null : { id: message.id, type: 'actions' });
                }}>
                  {message.deleted ? <p>삭제된 메시지입니다.</p> : <>
                    {message.content && <p className="message-text">{message.content}</p>}
                    {(message.attachments ?? []).map((attachment) => attachment.type === 'image' ? <img className="message-image" key={attachment.id} src={attachment.url} alt={attachment.name} /> : <a key={attachment.id} className="message-link" href={attachment.url} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span><span>{attachment.url}</span></a>)}
                    {!openMenu && <div className="message-toolbar">
                      <button type="button" title="메시지 작업" aria-label="메시지 작업" aria-haspopup="true" aria-expanded={false} disabled={busy} onClick={(e) => toggleMenu(message, 'actions', e.currentTarget)}><img src={dotsIcon} alt="" /></button>
                    </div>}
                    {openMenu && <div ref={popoverRef} className={`message-popover ${menu.type === 'emoji' ? 'emoji-picker' : 'message-actions-menu'}`} aria-label={menu.type === 'emoji' ? '이모티콘 선택' : '메시지 작업'}>
                      {menu.type === 'emoji' ? REACTION_EMOJIS.map((emoji) => <button type="button" key={emoji} aria-label={`${emoji} 이모티콘`} aria-pressed={Boolean(message.reactions?.find((item) => item.emoji === emoji)?.mine)} onClick={() => toggleReaction(message, emoji)}>{emoji}</button>) : <>
                        <button type="button" onClick={() => startReply(message)}>답장</button>
                        <button type="button" disabled={!capabilities.reactions} title={!capabilities.reactions ? '서버에서 이모티콘 반응을 지원하지 않아요.' : undefined} onClick={() => setMenu({ id: message.id, type: 'emoji' })}>이모티콘</button>
                        <button type="button" onClick={() => copyMessage(message)}>복사</button>
                        {message.mine && capabilities.deletion && <button type="button" className="message-delete" onClick={async () => { setMenu(null); if (await mutate(() => chatApi.deleteMessage(room.id, message.id)) && replyToId === message.id) setReplyToId(null); }}>삭제</button>}
                      </>}
                    </div>}
                  </>}
                </div>
                </div>
                {showTimestamp && <div className="message-meta"><span>{formatChatTime(message.time)}</span></div>}
                {!message.deleted && (message.reactions ?? []).length > 0 && <div className="message-reactions" aria-label="메시지 반응">{message.reactions.map((reaction) => <button type="button" key={reaction.emoji} className={reaction.mine ? 'is-mine' : ''} aria-label={`${reaction.emoji} 반응 ${reaction.count}개`} aria-pressed={reaction.mine} disabled={busy} onClick={() => toggleReaction(message, reaction.emoji)}>{reaction.emoji} <span>{reaction.count}</span></button>)}</div>}
              </div>
            </article>
            </Fragment>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="chat-composer" onSubmit={send}>
        {replyToId && <div className="composer-reply"><svg className="composer-reply-arrow" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 3v10a7 7 0 0 0 7 7h12m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg><div><strong>{replyMessage?.senderName || '메시지'}에게 답장</strong><span>{messagePreview(replyMessage)}</span></div><button type="button" aria-label="답장 취소" disabled={busy} onClick={() => { setReplyToId(null); clientIdRef.current = null; }}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>}
        {attachments.length > 0 && <div className="composer-attachments" aria-label="전송할 첨부">{attachments.map((item) => <div className="composer-attachment" key={item.id}>{item.type === 'image' ? <img src={item.url} alt={item.name} /> : <span className="composer-link-preview">↗ {item.url}</span>}<button type="button" aria-label={`${item.name || item.url} 첨부 취소`} disabled={busy || uploading} onClick={() => { setAttachments((current) => current.filter((attachment) => attachment.id !== item.id)); clientIdRef.current = null; }}>×</button></div>)}</div>}
        {linkOpen && <div className="composer-link-panel"><label htmlFor="chat-link-input">링크 첨부</label><div><input id="chat-link-input" type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} disabled={busy || uploading} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addLink(); } }} /><button type="button" onClick={addLink} disabled={busy || uploading}>추가</button><button type="button" aria-label="링크 첨부 닫기" onClick={() => setLinkOpen(false)}>×</button></div></div>}
        <p className="chat-message-error" role="alert">{error}{error && !getToken() && <> <Link to="/login" state={{ from: `/chat/rooms/${room.id}` }}>로그인하기</Link></>}</p>
        <p className="chat-message-notice" role="status">{uploading ? '이미지를 준비하고 있어요.' : ''}</p>
        <div className="input-area">
          <input ref={fileInputRef} type="file" aria-label="이미지 파일" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={attachImages} />
          {capabilities.attachments && <button type="button" className="composer-tool" title="이미지 첨부" aria-label="이미지 첨부" disabled={busy || uploading} onClick={() => fileInputRef.current?.click()}><img src={cameraIcon} alt="" /></button>}
          {capabilities.attachments && <button type="button" className="composer-tool" title="링크 첨부" aria-label="링크 첨부" aria-expanded={linkOpen} disabled={busy || uploading} onClick={() => setLinkOpen((value) => !value)}><img src={clipIcon} alt="" /></button>}
          <textarea ref={textInputRef} className="message-input" aria-label="메시지 입력" placeholder="메시지 입력…" rows={1} maxLength={messageLimit} value={content} disabled={busy} onChange={(e) => { setContent(e.target.value); clientIdRef.current = null; }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} />
          <button type="submit" className="chat-send-button" title="전송" aria-label="메시지 전송" disabled={busy || uploading || (!content.trim() && !attachments.length)}><img src={gotripplane} alt="" /></button>
        </div>
      </form>
      {roomEditOpen && <dialog ref={roomEditDialogRef} className="chat-room-action-dialog" aria-labelledby="chat-room-edit-title"
        onCancel={(event) => { event.preventDefault(); if (!roomActionBusy) setRoomEditOpen(false); }}
        onClick={(event) => { if (event.target === roomEditDialogRef.current && !roomActionBusy) setRoomEditOpen(false); }}>
        <form className="chat-room-action-form" onSubmit={saveRoomName}>
          <h2 id="chat-room-edit-title">채팅방 수정</h2>
          <label htmlFor="chat-room-name-edit">채팅방 이름</label>
          <input id="chat-room-name-edit" autoFocus maxLength={100} value={roomNameDraft} disabled={roomActionBusy} onChange={(event) => { setRoomNameDraft(event.target.value); setRoomActionError(''); }} />
          <p className="chat-room-action-error" role="alert">{roomActionError}</p>
          <div className="chat-room-action-buttons">
            <button type="button" className="is-secondary" disabled={roomActionBusy} onClick={() => setRoomEditOpen(false)}>취소</button>
            <button type="submit" className="is-primary" disabled={roomActionBusy}>{roomActionBusy ? '저장 중…' : '저장'}</button>
          </div>
        </form>
      </dialog>}
    </main>
  );
}
export default ChatHome;
