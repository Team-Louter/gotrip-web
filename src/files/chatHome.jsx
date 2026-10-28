import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gotrippro from '../images/gotrip-pro.jpg';
import gotripplane from '../icons/gotrip-plane.png';
import replyIcon from '../icons/gotrip-reply.png';
import smileIcon from '../icons/gotrip-smile.png';
import dotsIcon from '../icons/gotrip-dots.png';
import cameraIcon from '../icons/gotrip-camera.png';
import clipIcon from '../icons/gotrip-clip.png';
import { chatApi } from '../services/chatApi';
import { getToken } from '../api/session';
import { MESSAGE_PAGE_SIZE } from '../services/serverChatApi';
import { REACTION_EMOJIS, httpUrl, messagePreview, validateImages } from '../data/chatMessages';
import '../styles/chatMessages.css';

function ChatHome({ room, onRoomUpdated, syncError = '', onRetrySync }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [replyToId, setReplyToId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const historyBusy = useRef(false);
  const historyController = useRef(null);
  const areaRef = useRef(null);
  const historyAnchor = useRef(null);
  const followLatest = useRef(true);
  const capabilities = chatApi.capabilities;
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const endRef = useRef(null);
  const popoverRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const mutationBusy = useRef(false);
  const uploadBusy = useRef(false);
  const clientIdRef = useRef(null);
  const messageRefs = useRef(new Map());
  const noticeTimerRef = useRef(null);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (historyAnchor.current && area) {
      area.scrollTop = historyAnchor.current.top + area.scrollHeight - historyAnchor.current.height;
      historyAnchor.current = null;
    } else if (followLatest.current) endRef.current?.scrollIntoView({ block: 'end' });
  }, [room.messages.length, room.hasOlderMessages]);
  useEffect(() => () => clearTimeout(noticeTimerRef.current), []);
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

  async function mutate(operation) {
    if (mutationBusy.current) return false;
    mutationBusy.current = true; setBusy(true); setError(''); setNotice('');
    try { onRoomUpdated(await operation()); return true; }
    catch (reason) { setError(reason.message || '변경 내용을 저장하지 못했어요.'); return false; }
    finally { mutationBusy.current = false; setBusy(false); }
  }

  function toggleMenu(message, type, trigger) {
    menuTriggerRef.current = trigger;
    setMenu((current) => current?.id === message.id && current.type === type ? null : { id: message.id, type });
  }

  function startReply(message) {
    setReplyToId(message.id); setMenu(null); clientIdRef.current = null;
    textInputRef.current?.focus();
  }

  async function send(e) {
    e.preventDefault();
    if (mutationBusy.current || uploadBusy.current || (!content.trim() && !attachments.length)) return;
    clientIdRef.current ||= crypto.randomUUID();
    const saved = await mutate(() => chatApi.sendMessage(room.id, { content, attachments, replyToId, clientId: clientIdRef.current }));
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
      clearTimeout(noticeTimerRef.current);
      setNotice('복사되었습니다'); setError('');
      noticeTimerRef.current = setTimeout(() => setNotice(''), 2000);
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
        <img className="room-profile" src={gotrippro} alt="" />
        <div><p className="room-name">{room.name}</p><p className="room-status">{room.membersKnown === false ? '여행 대화' : `${room.members.length + 1}명 · ${[...room.members.map((member) => member.name), '나'].join(', ')}`}</p></div>
      </div>
      {syncError && <div className="chat-sync-error" role="alert">{syncError} {!getToken() ? <Link to="/islogin" state={{ from: `/chat/${room.id}` }}>다시 로그인</Link> : <button type="button" onClick={onRetrySync}>다시 시도</button>}</div>}
      <div ref={areaRef} className="message-area" aria-label="대화 내용" onScroll={(event) => { const area = event.currentTarget; followLatest.current = area.scrollHeight - area.scrollTop - area.clientHeight < 100; }}>
        {room.hasOlderMessages && <button type="button" className="chat-load-older" disabled={loadingOlder} onClick={loadOlder}>{loadingOlder ? '불러오는 중…' : '이전 대화 불러오기'}</button>}
        {room.messages.length === 0 ? <p className="chat-conversation-empty">아직 메시지가 없습니다.</p> : room.messages.map((message) => {
          const original = room.messages.find((item) => item.id === message.replyToId);
          const openMenu = menu?.id === message.id;
          return (
            <article className={`${message.mine ? 'me-row' : 'msg-row'} chat-message-row`} key={message.id} aria-label={`메시지 ${message.id}`} tabIndex={-1}
              ref={(element) => { if (element) messageRefs.current.set(message.id, element); else messageRefs.current.delete(message.id); }}>
              {!message.mine && <img className="msg-profile" src={gotrippro} alt="" />}
              <div className="chat-message-content">
                {!message.mine && <p className="chat-sender-name">{message.senderName}</p>}
                {!message.deleted && <>
                  <div className={`message-toolbar${openMenu ? ' is-open' : ''}`} role="toolbar" aria-label="메시지 작업">
                    {capabilities.replies && <button type="button" title="답장" aria-label="답장" disabled={busy} onClick={() => startReply(message)}><img src={replyIcon} alt="" /></button>}
                    {capabilities.reactions && <button type="button" title="이모지 달기" aria-label="이모지 달기" aria-expanded={openMenu && menu.type === 'emoji'} disabled={busy} onClick={(e) => toggleMenu(message, 'emoji', e.currentTarget)}><img src={smileIcon} alt="" /></button>}
                    <button type="button" title="더보기" aria-label="더보기" aria-expanded={openMenu && menu.type === 'more'} disabled={busy} onClick={(e) => toggleMenu(message, 'more', e.currentTarget)}><img src={dotsIcon} alt="" /></button>
                  </div>
                  {openMenu && <div ref={popoverRef} className={`message-popover ${menu.type === 'emoji' ? 'emoji-picker' : 'message-more-menu'}`} aria-label={menu.type === 'emoji' ? '이모지 선택' : '메시지 더보기'}>
                    {menu.type === 'emoji' ? REACTION_EMOJIS.map((emoji) => <button type="button" key={emoji} aria-label={`${emoji} 반응`} aria-pressed={Boolean(message.reactions?.find((item) => item.emoji === emoji)?.mine)} onClick={() => toggleReaction(message, emoji)}>{emoji}</button>) : <>
                      <button type="button" onClick={() => copyMessage(message)}>복사</button>
                      {message.mine && capabilities.editing && <>
                        {message.content && <button type="button" onClick={() => { setEditingId(message.id); setEditText(message.content); setMenu(null); }}>수정</button>}
                        <button type="button" className="message-delete" onClick={async () => { setMenu(null); if (await mutate(() => chatApi.deleteMessage(room.id, message.id))) { if (replyToId === message.id) setReplyToId(null); if (editingId === message.id) setEditingId(null); } }}>삭제</button>
                      </>}
                    </>}
                  </div>}
                </>}
                {message.replyToId && !message.deleted && <button type="button" className="message-original" aria-label="원본 메시지 보기" title={messagePreview(original)} onClick={() => { const element = messageRefs.current.get(message.replyToId); element?.scrollIntoView({ block: 'center', behavior: 'smooth' }); element?.focus({ preventScroll: true }); }}>
                  <strong>{original?.senderName || '원본 메시지'}</strong><span>{messagePreview(original)}</span>
                </button>}
                <div className={message.replyToId && !message.deleted ? 'message-reply-body' : undefined}>
                  {message.replyToId && !message.deleted && <svg className="message-reply-arrow" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 3v10a7 7 0 0 0 7 7h12m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {editingId === message.id ? <form className="message-edit-form" onSubmit={async (e) => { e.preventDefault(); if (await mutate(() => chatApi.editMessage(room.id, message.id, editText))) setEditingId(null); }}>
                  <textarea autoFocus aria-label="메시지 수정" value={editText} maxLength={4000} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }} />
                  <div><button type="button" disabled={busy} onClick={() => setEditingId(null)}>취소</button><button type="submit" disabled={busy || !editText.trim()}>저장</button></div>
                </form> : <div className={`${message.mine ? 'right-bubble' : 'left-bubble'} message-surface${message.deleted ? ' message-deleted' : ''}`}>
                  {message.deleted ? <p>삭제된 메시지입니다.</p> : <>
                    {message.content && <p className="message-text">{message.content}</p>}
                    {(message.attachments ?? []).map((attachment) => attachment.type === 'image' ? <img className="message-image" key={attachment.id} src={attachment.url} alt={attachment.name} /> : <a key={attachment.id} className="message-link" href={attachment.url} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span><span>{attachment.url}</span></a>)}
                  </>}
                </div>}
                </div>
                <div className="message-meta"><span>{message.time}</span>{message.edited && !message.deleted && <span>수정됨</span>}</div>
                {!message.deleted && (message.reactions ?? []).length > 0 && <div className="message-reactions" aria-label="메시지 반응">{message.reactions.map((reaction) => <button type="button" key={reaction.emoji} className={reaction.mine ? 'is-mine' : ''} aria-label={`${reaction.emoji} 반응 ${reaction.count}개`} aria-pressed={reaction.mine} disabled={busy} onClick={() => toggleReaction(message, reaction.emoji)}>{reaction.emoji} <span>{reaction.count}</span></button>)}</div>}
              </div>
            </article>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="chat-composer" onSubmit={send}>
        {replyToId && <div className="composer-reply"><svg className="composer-reply-arrow" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 3v10a7 7 0 0 0 7 7h12m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg><div><strong>{replyMessage?.senderName || '메시지'}에게 답장</strong><span>{messagePreview(replyMessage)}</span></div><button type="button" aria-label="답장 취소" disabled={busy} onClick={() => { setReplyToId(null); clientIdRef.current = null; }}>×</button></div>}
        {attachments.length > 0 && <div className="composer-attachments" aria-label="전송할 첨부">{attachments.map((item) => <div className="composer-attachment" key={item.id}>{item.type === 'image' ? <img src={item.url} alt={item.name} /> : <span className="composer-link-preview">↗ {item.url}</span>}<button type="button" aria-label={`${item.name || item.url} 첨부 취소`} disabled={busy || uploading} onClick={() => { setAttachments((current) => current.filter((attachment) => attachment.id !== item.id)); clientIdRef.current = null; }}>×</button></div>)}</div>}
        {linkOpen && <div className="composer-link-panel"><label htmlFor="chat-link-input">링크 첨부</label><div><input id="chat-link-input" type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} disabled={busy || uploading} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addLink(); } }} /><button type="button" onClick={addLink} disabled={busy || uploading}>추가</button><button type="button" aria-label="링크 첨부 닫기" onClick={() => setLinkOpen(false)}>×</button></div></div>}
        <p className="chat-message-error" role="alert">{error}{error && !chatApi.useMock && !getToken() && <> <Link to="/islogin" state={{ from: `/chat/${room.id}` }}>로그인하기</Link></>}</p>
        <p className="chat-message-notice" role="status">{uploading ? '이미지를 준비하고 있어요.' : notice}</p>
        <div className="input-area">
          <input ref={fileInputRef} type="file" aria-label="이미지 파일" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={attachImages} />
          {capabilities.attachments && <button type="button" className="composer-tool" title="이미지 첨부" aria-label="이미지 첨부" disabled={busy || uploading} onClick={() => fileInputRef.current?.click()}><img src={cameraIcon} alt="" /></button>}
          {capabilities.attachments && <button type="button" className="composer-tool" title="링크 첨부" aria-label="링크 첨부" aria-expanded={linkOpen} disabled={busy || uploading} onClick={() => setLinkOpen((value) => !value)}><img src={clipIcon} alt="" /></button>}
          <textarea ref={textInputRef} className="message-input" aria-label="메시지 입력" placeholder="메시지 입력…" rows={1} maxLength={chatApi.maxMessageLength} value={content} disabled={busy} onChange={(e) => { setContent(e.target.value); clientIdRef.current = null; }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} />
          <button type="submit" className="chat-send-button" title="전송" aria-label="메시지 전송" disabled={busy || uploading || (!content.trim() && !attachments.length)}><img src={gotripplane} alt="" /></button>
        </div>
      </form>
    </main>
  );
}
export default ChatHome;
