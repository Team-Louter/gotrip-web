import '../styles/calender.css';
import todayPlaceIcon from '../icons/todaySchedulePlaceIcon.png';

function Calender() {
  return (
    <div className='calender-container'>
      <div className='calender-content-box'>
        <div className='content-box'>
          <div className='calender-text-box'>
            <span className='calender-title'>2026년 7월 · 제주 3박 4일</span>
            <span className='today-period'>7월 14일 화요일부터 7월 17일 금요일까지</span>
          </div>

          <table className='calender'>
            <thead>
              <tr>
                <td className='weekdays sunday'>일</td>
                <td className='weekdays'>월</td>
                <td className='weekdays'>화</td>
                <td className='weekdays'>수</td>
                <td className='weekdays'>목</td>
                <td className='weekdays'>금</td>
                <td className='weekdays'>토</td>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>7</td>
                <td><div className='today'>8</div></td>
                <td>9</td>
                <td>10</td>
                <td>11</td>
                <td>12</td>
                <td>13</td>
              </tr>
              <tr>
                <td className='travel-days'>
                  14
                  <div className='schedule-card yellow-card'>항공</div>
                  <div className='schedule-card blue-card'>렌터카</div>
                </td>
                <td className='travel-days'>
                  15
                  <div className='schedule-card green-card'>숙소</div>
                  <div className='schedule-card purple-card'>맛집</div>
                </td>
                <td className='travel-days'>
                  16
                  <div className='schedule-card blue-card'>우도</div>
                  <div className='schedule-card yellow-card'>사진</div>
                </td>
                <td className='travel-days'>
                  17
                  <div className='schedule-card green-card'>체크아웃</div>
                </td>
                <td>18</td>
                <td>19</td>
                <td>20</td>
              </tr>
              <tr>
                <td>21</td>
                <td>
                  22
                  <div className='schedule-card purple-card'>회의</div>
                </td>
                <td>23</td>
                <td>24</td>
                <td>25</td>
                <td>26</td>
                <td>27</td>
              </tr>
              <tr>
                <td>28</td>
                <td>29</td>
                <td>30</td>
                <td>31</td>
                <td>1</td>
                <td>2</td>
                <td>3</td>
              </tr>
            </tbody>
            
          </table>
        </div>
      </div>  

      <div className='calender-today-box'>
        <div className='today-title'>
          <span className='today-schedule-title'>오늘 일정</span>
          <span className='today-info'>7월 15일 수요일</span>
        </div>

        <div className='today-schedule-line'></div>
        
        <div className='today-schedule-box'>
          <div className='today-schedule-content today-schedule'>
            <span className='today-schedule-time today-time'>09:30</span>
            <span className='today-schedule-text'>성산 이동</span>
            <div className='today-schedule-place-box'>
              <img src={todayPlaceIcon} alt="today-schedule-place-icon" className='schedule-place-icon'/>
              <span className='today-schedule-place'>성산읍</span>
            </div>
          </div>

          <div className='today-schedule-content'>
            <span className='today-schedule-time'>12:10</span>
            <span className='today-schedule-text'>점심 예약</span>
            <div className='today-schedule-place-box'>
              <img src={todayPlaceIcon} alt="today-schedule-place-icon" className='schedule-place-icon'/>
              <span className='today-schedule-place'>갈치조림</span>
            </div>
          </div>

          <div className='today-schedule-content'>
            <span className='today-schedule-time'>16:00</span>
            <span className='today-schedule-text'>카페 투어</span>
            <div className='today-schedule-place-box'>
              <img src={todayPlaceIcon} alt="today-schedule-place-icon" className='schedule-place-icon'/>
              <span className='today-schedule-place'>월정리</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Calender;