import { useState } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import { TRIP_DURATION, addDays, calendarDates, dateKey, formatDate, schedulesOn, shiftMonth } from '../data/scheduleDates';
import { deleteSchedule, selectScheduleDate } from '../data/scheduleStore';
import todayPlaceIcon from '../icons/todaySchedulePlaceIcon.png';
import '../styles/calender.css';

function Calender() {
  const { startDate, selectedDate, events } = useSchedules();
  const [monthView, setMonthView] = useState(() => ({ selectedDate, month: selectedDate.slice(0, 7) }));
  const month = monthView.selectedDate === selectedDate ? monthView.month : selectedDate.slice(0, 7);
  const dates = calendarDates(month);
  const selectedEvents = schedulesOn(events, selectedDate);
  const today = dateKey();
  const travelEnd = addDays(startDate, TRIP_DURATION - 1);

  function changeMonth(offset) {
    setMonthView({ selectedDate, month: shiftMonth(month, offset) });
  }

  function selectDate(date) {
    selectScheduleDate(date);
    setMonthView({ selectedDate: date, month: date.slice(0, 7) });
  }

  return (
    <div className="calender-container">
      <section className="calender-content-box" aria-label="여행 캘린더">
        <div className="calendar-heading">
          <div className="calender-text-box">
            <h1 className="calender-title">{formatDate(selectedDate, { year: 'numeric', month: 'long', day: 'numeric' })}</h1>
            <p className="today-period">{formatDate(startDate, { month: 'long', day: 'numeric', weekday: 'long' })}부터 {formatDate(travelEnd, { month: 'long', day: 'numeric', weekday: 'long' })}까지</p>
          </div>
          <nav className="calendar-month-nav" aria-label="캘린더 월 이동">
            <button type="button" aria-label="이전 달" disabled={month === '0001-01'} onClick={() => changeMonth(-1)}>‹</button>
            <span aria-live="polite">{formatDate(`${month}-01`, { year: 'numeric', month: 'long' })}</span>
            <button type="button" aria-label="다음 달" disabled={month === '9999-12'} onClick={() => changeMonth(1)}>›</button>
          </nav>
        </div>
        <table className="calender" aria-label={formatDate(`${month}-01`, { year: 'numeric', month: 'long' })}>
          <thead><tr>{['일', '월', '화', '수', '목', '금', '토'].map((day, index) => <th scope="col" key={day} className={`weekdays${index === 0 ? ' sunday' : ''}`}>{day}</th>)}</tr></thead>
          <tbody>{Array.from({ length: dates.length / 7 }, (_, week) => (
            <tr key={week}>{dates.slice(week * 7, week * 7 + 7).map((date) => {
              const dayEvents = schedulesOn(events, date);
              const inTrip = date >= startDate && date <= travelEnd;
              const outsideMonth = date.slice(0, 7) !== month;
              return (
                <td key={date} className={`${inTrip ? 'travel-days ' : ''}${outsideMonth ? 'calendar-outside' : ''}`}>
                  <button type="button" className="calendar-day-button" aria-label={`${formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' })}, 일정 ${dayEvents.length}개`}
                    aria-pressed={date === selectedDate} aria-current={date === today ? 'date' : undefined} onClick={() => selectDate(date)}>
                    <span className={`calendar-day-number${date === today ? ' today' : ''}`}>{Number(date.slice(8))}</span>
                    {dayEvents.slice(0, 2).map((event) => <span className="schedule-card" key={event.id} title={`${event.time} ${event.content}`}>{event.content}</span>)}
                  </button>
                </td>
              );
            })}</tr>
          ))}</tbody>
        </table>
      </section>
      <aside className="calender-today-box" aria-label="선택한 날짜의 일정">
        <div className="today-title">
          <h2 className="today-schedule-title">{selectedDate === today ? '오늘 일정' : '선택한 날 일정'}</h2>
          <span className="today-info">{formatDate(selectedDate, { month: 'long', day: 'numeric', weekday: 'long' })}</span>
        </div>
        <div className="today-schedule-line" />
        <div className="today-schedule-box">
          {selectedEvents.length === 0 ? <p className="calendar-empty">등록된 일정이 없습니다.</p> : selectedEvents.map((event) => (
            <article className="today-schedule-content" key={event.id}>
              <div className="calendar-event-heading">
                <time className="today-schedule-time" dateTime={`${event.date}T${event.time}`}>{event.time}</time>
                <button type="button" className="calendar-delete-button" aria-label={`${event.time} ${event.content} 삭제`} onClick={() => deleteSchedule(event.id)}>삭제</button>
              </div>
              <p className="today-schedule-text">{event.content}</p>
              {event.location && <div className="today-schedule-place-box"><img src={todayPlaceIcon} alt="" className="schedule-place-icon" /><span className="today-schedule-place">{event.location}</span></div>}
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
export default Calender;
