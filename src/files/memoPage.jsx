import { useEffect, useRef, useState } from 'react'
import '../styles/memoPage.css'

const INITIAL_MEMOS = [
  {
    id: 1,
    title: '오늘의 방문 기록',
    body: '카페 앞 입구가 혼잡함. 다음 방문 때 뒷문 경로 확인 필요\n카페 메뉴가 호불호를 많이 탐. 다음에는 유명한 카페로 방문하기',
    summary: '카페 앞 입구가 혼잡함. 다음 방문 때 뒷문 경로 확인 필요',
  },
  {
    id: 2,
    title: '다시 확인할 장소',
    body: '주차 가능시간과 출입 방향을 다시 체크하기.',
    summary: '주차 가능시간과 출입 방향을 다시 체크하기.',
  },
]

// 검색어를 공백 기준으로 나눠 모두 포함하는 메모를 찾음
// (제목 + 내용 + 한줄 요약에서 검색, 띄어쓰기는 무시)
function matchesQuery(memo, query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  const text = `${memo.title} ${memo.body} ${memo.summary}`.toLowerCase()
  const flat = text.replace(/\s+/g, '')
  return tokens.every((t) => text.includes(t) || flat.includes(t))
}

function Memo() {
  const [memos, setMemos] = useState(INITIAL_MEMOS)
  const [selectedId, setSelectedId] = useState(1)
  const [query, setQuery] = useState('')
  const [summaryText, setSummaryText] = useState(INITIAL_MEMOS[0].summary)
  const [saved, setSaved] = useState(false)

  const titleRef = useRef(null)
  const listRef = useRef(null)
  const focusTitleRef = useRef(false)
  const savedTimerRef = useRef(null)

  const current = memos.find((m) => m.id === selectedId)
  const filteredMemos = memos.filter((m) => matchesQuery(m, query))

  // 새 메모를 만든 직후: 리스트 맨 위로 스크롤 + 제목에 포커스
  useEffect(() => {
    if (!focusTitleRef.current) return
    focusTitleRef.current = false
    if (listRef.current) listRef.current.scrollTop = 0
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [selectedId])

  useEffect(() => () => clearTimeout(savedTimerRef.current), [])

  const updateCurrent = (patch) => {
    setMemos((prev) =>
      prev.map((m) => (m.id === selectedId ? { ...m, ...patch } : m))
    )
  }

  const handleSelect = (memo) => {
    setSelectedId(memo.id)
    setSummaryText(memo.summary)
  }

  // 메모 삭제: 선택 중인 메모를 지우면 바로 아래(없으면 위) 메모가 선택됨
  const handleDeleteMemo = (memo) => {
    if (!window.confirm('이 메모를 삭제할까요?')) return
    const index = memos.findIndex((m) => m.id === memo.id)
    const remaining = memos.filter((m) => m.id !== memo.id)
    setMemos(remaining)
    if (memo.id === selectedId) {
      const next = remaining[index] ?? remaining[index - 1] ?? null
      setSelectedId(next ? next.id : null)
      setSummaryText(next ? next.summary : '')
    }
  }

  // + 버튼: 새 메모 자동 생성 -> 리스트에 추가 -> 새 메모창으로 이동
  const handleAddMemo = () => {
    const newMemo = { id: Date.now(), title: '새 메모', body: '', summary: '' }
    setMemos((prev) => [newMemo, ...prev])
    setQuery('')
    setSelectedId(newMemo.id)
    setSummaryText('')
    focusTitleRef.current = true
  }

  // 리스트 제목 밑에 표시 (비어 있으면 표시 안 함)
  const handleSaveSummary = () => {
    if (!current) return
    const cleaned = summaryText.replace(/\s*\n\s*/g, ' ').trim()
    updateCurrent({ summary: cleaned })
    setSummaryText(cleaned)
    setSaved(true)
    clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div className="memo-page">
      <div className="memo-board">
        <input
          ref={titleRef}
          className="memo-title-input"
          type="text"
          value={current?.title ?? ''}
          onChange={(e) => updateCurrent({ title: e.target.value })}
          placeholder="제목"
          disabled={!current}
        />
        <textarea
          className="memo-board-input"
          value={current?.body ?? ''}
          onChange={(e) => updateCurrent({ body: e.target.value })}
          placeholder="여기에 자유롭게 메모하세요"
          disabled={!current}
        />
      </div>
      <div className="memo-side">
        <div className="memo-header">
          <h2>메모</h2>
          <button className="memo-plus" onClick={handleAddMemo}>
            +
          </button>
        </div>

        <div className="memo-list-box">
          <input
            className="memo-search"
            type="text"
            placeholder="메모 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {/* 메모가 많아지면 이 영역만 스크롤 */}
          <div className="memo-list" ref={listRef}>
            {memos.length === 0 && (
              <p className="memo-empty">
                메모가 없어요. + 버튼으로 새 메모를 추가해 보세요
              </p>
            )}
            {memos.length > 0 && filteredMemos.length === 0 && (
              <p className="memo-empty">검색 결과가 없어요</p>
            )}
            {filteredMemos.map((memo) => (
              <div
                key={memo.id}
                className={`memo-item${memo.id === selectedId ? ' selected' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(memo)}
                onKeyDown={(e) => {
                  // 안쪽 삭제 버튼에서 누른 키는 무시
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(memo)
                  }
                }}
              >
                <div className="memo-item-top">
                  <p className="memo-item-title">{memo.title || '제목 없음'}</p>
                  <button
                    type="button"
                    className="memo-delete"
                    aria-label={`${memo.title || '제목 없음'} 삭제`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMemo(memo)
                    }}
                  >
                    삭제
                  </button>
                </div>
                {memo.summary && (
                  <p className="memo-item-summary">{memo.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="memo-detail">
          <div className="memo-detail-top">
            <span className="memo-badge">한줄 요약</span>
          </div>

          <textarea
            className="memo-textarea"
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            disabled={!current}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSaveSummary()
              }
            }}
          />
          <button
            className="memo-save"
            onClick={handleSaveSummary}
            disabled={!current}
          >
            {saved ? '저장됨' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Memo