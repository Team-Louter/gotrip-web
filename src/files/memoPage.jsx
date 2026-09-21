import '../styles/memoPage.css'

function Memo() {
  return (
    <div>
      <div className="top-bar"></div>

      <div className="memo-page">
        <div className="memo-board">
          <p>카페 앞 입구가 혼잡함. 다음 방문 때 뒷문 경로 확인 필요</p>
          <p>카페 메뉴가 호불호를 많이 탐. 다음에는 유명한 카페로 방문하기</p>
        </div>

        <div className="memo-side">
          <div className="memo-header">
            <h2>메모</h2>
            <button className="memo-plus">+</button>
          </div>

          <div className="memo-list-box">
            <input className="memo-search" type="text" placeholder="메모 검색" />
            <div className="memo-item selected">
              <p className="memo-item-title">오늘의 방문 기록</p>
              <p>카페 앞 입구가 혼잡함. 다음 방문 때 뒷문 경로 확인 필요</p>
            </div>
            <div className="memo-item">
              <p className="memo-item-title">다시 확인할 장소</p>
              <p>주차 가능시간과 출입 방향을 다시 체크하기.</p>
            </div>
          </div>

          <div className="memo-detail">
            <div className="memo-detail-top">
              <span className="memo-badge">현재 위치</span>
              <span>자동저장됨</span>
            </div>
            <p className="memo-detail-title">오늘의 방문 기록</p>
            <textarea className="memo-textarea" />
            <button className="memo-save">저장</button>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default Memo