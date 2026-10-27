import { useEffect, useRef, useState } from 'react';
import editIcon from '../icons/editIcon.png';
import deleteIcon from '../icons/deleteIcon.png';
import { useSchedules } from '../hooks/useSchedules';
import { TRIP_DURATION, addDays, formatDate, schedulesOn } from '../data/scheduleDates';
import { deleteSchedule, saveSchedule, selectScheduleDate, setTripStart } from '../data/scheduleStore';
import '../styles/schedule.css';

function ScheduleEditor({ event, selectedDate, onClose }) {
  const dialogRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function submit(e) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const date = values.get('date');
    const time = values.get('time');
    const content = values.get('content');
    if (!content.trim()) {
      setError('일정 내용을 입력해 주세요.');
      return;
    }
    if (saveSchedule({ id: event?.id, date, time, content })) onClose();
    else setError('날짜와 시간을 확인해 주세요.');
  }

  return (
    <dialog ref={dialogRef} className="trip-editor" aria-labelledby="trip-editor-title" onCancel={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}>
      <form className="trip-editor-form" onSubmit={submit}>
        <span className="trip-eyebrow">MY SCHEDULE</span>
        <h2 id="trip-editor-title">{event ? '일정 수정' : '새로운 일정'}</h2>
        <div className="trip-editor-fields">
          <label>날짜<input type="date" required min="0001-01-01" max="9999-12-31" name="date" defaultValue={event?.date ?? selectedDate} /></label>
          <label>시간<input type="time" required name="time" defaultValue={event?.time ?? '09:00'} /></label>
        </div>
        <label>일정 내용<textarea autoFocus required maxLength={200} rows={3} placeholder="어떤 여행을 계획하고 있나요?" name="content" defaultValue={event?.content ?? ''} onChange={() => setError('')} /></label>
        <p className="trip-field-error" role="alert">{error}</p>
        <div className="trip-editor-actions">
          <button type="button" className="trip-secondary" onClick={onClose}>취소</button>
          <button type="submit" className="trip-primary">{event ? '변경 저장' : '일정 추가'}</button>
        </div>
      </form>
    </dialog>
  );
}

export default function SchedulePanel({ compact = false }) {
  const { startDate, selectedDate, events, storageError } = useSchedules();
  const [editor, setEditor] = useState(null);
  const selectedEvents = schedulesOn(events, selectedDate);
  const dates = Array.from({ length: TRIP_DURATION }, (_, index) => addDays(startDate, index));

  return (
    <section className={`map-schedule-container trip-panel${compact ? ' trip-panel-compact' : ''}`} aria-label="내 여행 일정">
      <div className="trip-panel-heading">
        <h1>MY<br />SCHEDULE</h1>
        <button className="trip-primary trip-add" onClick={() => setEditor({ event: null })}>추가</button>
      </div>
      <label className="trip-start-label"><span>여행<br />시작일</span>
        <input aria-label="여행 시작일" type="date" min="0001-01-01" max="9999-12-27" value={startDate}
          onChange={(e) => { if (e.target.validity.valid) setTripStart(e.target.value); }} />
      </label>
      <nav className="trip-days" aria-label="여행 일차 선택">
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
            <p>{event.content}</p>
            <div className="trip-event-actions">
              <button className="trip-icon-button" aria-label={`${event.content} 수정`} onClick={() => setEditor({ event })}><img src={editIcon} alt="" /></button>
              <button className="trip-icon-button" aria-label={`${event.content} 삭제`} onClick={() => deleteSchedule(event.id)}><img src={deleteIcon} alt="" /></button>
            </div>
          </article>
        ))}
      </div>
      {storageError && <p className="trip-notice" role="status">브라우저에 저장할 수 없어 새로고침하면 변경 내용이 사라질 수 있어요.</p>}
      {editor && <ScheduleEditor event={editor.event} selectedDate={selectedDate} onClose={() => setEditor(null)} />}
    </section>
  );
}
