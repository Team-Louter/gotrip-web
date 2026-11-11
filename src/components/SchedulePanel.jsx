import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getToken } from '../api/session';
import { tripApi } from '../services/tripApi';
import editIcon from '../icons/editIcon.png';
import deleteIcon from '../icons/deleteIcon.png';
import { useSchedules } from '../hooks/useSchedules';
import { addDays, formatDate, schedulesOn, tripDayCount } from '../data/scheduleDates';
import { deleteSchedule, saveSchedule, selectScheduleDate, setTripEnd, setTripStart } from '../data/scheduleStore';
import '../styles/schedule.css';

function resizeScheduleContent(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  const borders = textarea.offsetHeight - textarea.clientHeight;
  textarea.style.height = `${textarea.scrollHeight + borders}px`;
}

export function ScheduleEditor({ event, selectedDate, onClose }) {
  const location = useLocation();
  const dialogRef = useRef(null);
  const contentRef = useRef(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    resizeScheduleContent(contentRef.current);
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (submitting.current) return;
    const values = new FormData(e.currentTarget);
    const date = values.get('date');
    const time = values.get('time');
    const content = values.get('content');
    if (!content.trim()) {
      setError('일정 내용을 입력해 주세요.');
      return;
    }
    submitting.current = true; setSaving(true); setError('');
    try {
      const next = event ? { id: event.id, date, time, content } : await tripApi.addSchedule({ date, time, content });
      if (saveSchedule(next)) onClose();
      else setError('날짜와 시간을 확인해 주세요.');
    } catch (reason) { setError(reason.message); }
    finally { submitting.current = false; setSaving(false); }
  }

  return (
    <dialog ref={dialogRef} className="trip-editor" aria-labelledby="trip-editor-title" onCancel={(e) => { e.preventDefault(); if (!saving) onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current && !saving) onClose(); }}>
      <form className="trip-editor-form" onSubmit={submit}>
        <h2 id="trip-editor-title">{event ? '일정 수정' : '새로운 일정'}</h2>
        <fieldset disabled={saving} className="trip-editor-fieldset"><div className="trip-editor-fields">
          <label>날짜<input type="date" required min="0001-01-01" max="9999-12-31" name="date" defaultValue={event?.date ?? selectedDate} /></label>
          <label>시간<input type="time" required name="time" defaultValue={event?.time ?? '09:00'} /></label>
        </div>
        <label>일정 내용<textarea ref={contentRef} autoFocus required minLength={event ? 1 : 5} maxLength={200} rows={3} placeholder="어떤 여행을 계획하고 있나요?" name="content" defaultValue={event?.content ?? ''} onChange={(e) => { resizeScheduleContent(e.currentTarget); setError(''); }} /></label></fieldset>
        <p className="trip-field-error" role="alert">{error}{error && !getToken() && <> <Link to="/islogin" state={{ from: location.pathname }}>로그인하기</Link></>}</p>
        <div className="trip-editor-actions">
          <button type="button" className="trip-secondary" disabled={saving} onClick={onClose}>취소</button>
          <button type="submit" className="trip-primary" disabled={saving}>{saving ? '등록 중…' : event ? '변경 저장' : '일정 추가'}</button>
        </div>
      </form>
    </dialog>
  );
}

export default function SchedulePanel({ compact = false }) {
  const { startDate, endDate, selectedDate, events, storageError } = useSchedules();
  const [editor, setEditor] = useState(null);
  const selectedEvents = schedulesOn(events, selectedDate);
  const dates = Array.from({ length: tripDayCount(startDate, endDate) }, (_, index) => addDays(startDate, index));

  return (
    <section className={`map-schedule-container trip-panel${compact ? ' trip-panel-compact' : ''}`} aria-label="내 여행 일정">
      <div className="trip-panel-heading">
        <h1>내 여행 일정</h1>
        <button className="trip-primary trip-add" onClick={() => setEditor({ event: null })}>추가</button>
      </div>
      <label className="trip-start-label"><span>여행 시작일</span>
        <input aria-label="여행 시작일" type="date" min="0001-01-01" max="9999-12-31" value={startDate}
          onChange={(e) => { if (e.target.validity.valid) setTripStart(e.target.value); }} />
      </label>
      <label className="trip-start-label"><span>여행 종료일</span>
        <input aria-label="여행 종료일" type="date" min={startDate} max="9999-12-31" value={endDate}
          onChange={(e) => { if (e.target.validity.valid) setTripEnd(e.target.value); }} />
      </label>
      <nav className="trip-days" aria-label="여행 일차 선택" tabIndex={0}>
        {dates.map((date, index) => (
          <button key={date} className={`trip-day${selectedDate === date ? ' is-selected' : ''}`} aria-current={selectedDate === date ? 'date' : undefined}
            onClick={() => selectScheduleDate(date)}>
            <span>{index + 1}일차</span><small>{Number(date.slice(5, 7))}.{Number(date.slice(8))}</small>
          </button>
        ))}
      </nav>
      <div className="trip-selected-heading">
        <h2>{formatDate(selectedDate, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</h2>
      </div>
      <div className="trip-event-list">
        {selectedEvents.length === 0 ? (
          <div className="trip-empty"><strong>설레는 하루를 기록해보세요</strong></div>
        ) : selectedEvents.map((event) => (
          <article className="trip-event" key={event.id}>
            <time dateTime={`${event.date}T${event.time}`}>{event.time.replace(':', ' : ')}</time>
            <div className="trip-event-body"><p>{event.content}</p><small>{event.localChanges ? '이 브라우저에서 수정됨' : event.serverSynced ? '서버에 등록됨' : '이 브라우저의 일정'}</small></div>
            <div className="trip-event-actions">
              <button className="trip-icon-button" aria-label={`${event.content} 수정`} title="이 브라우저에서 수정" onClick={() => setEditor({ event })}><img src={editIcon} alt="" /></button>
              <button className="trip-icon-button" aria-label={`${event.content} ${event.serverSynced ? '목록에서 숨기기' : '삭제'}`} title={event.serverSynced ? '이 브라우저 목록에서 숨기기' : '삭제'} onClick={() => deleteSchedule(event.id)}><img src={deleteIcon} alt="" /></button>
            </div>
          </article>
        ))}
      </div>
      {storageError && <p className="trip-notice" role="status">브라우저에 저장할 수 없어 새로고침하면 변경 내용이 사라질 수 있어요.</p>}
      {editor && <ScheduleEditor event={editor.event} selectedDate={selectedDate} onClose={() => setEditor(null)} />}
    </section>
  );
}
