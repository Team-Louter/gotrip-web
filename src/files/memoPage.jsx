import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../api/session'
import { matchesMemo, memoApi } from '../services/memoApi'
import '../styles/memoPage.css'

function Memo() {
  const [memos, setMemos] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [list, setList] = useState({ status: 'loading', error: null })
  const [detail, setDetail] = useState({ id: null, error: null })
  const [loadRetry, setLoadRetry] = useState(0)
  const [detailRetry, setDetailRetry] = useState(0)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(null)
  const titleRef = useRef(null)
  const listRef = useRef(null)
  const focusTitleRef = useRef(false)
  const savedTimerRef = useRef(null)
  const mutationBusy = useRef(false)

  const current = memos.find((memo) => memo.id === selectedId)
  const filteredMemos = memos.filter((memo) => matchesMemo(memo, query))
  const loadingDetail = current && !current.isNew && detail.id !== selectedId
  const detailError = detail.id === selectedId ? detail.error : null
  const problem = actionError || detailError || list.error
  const editable = Boolean(current && !loadingDetail && !detailError && !busy)

  useEffect(() => {
    const controller = new AbortController()
    memoApi.getMemos({ signal: controller.signal }).then((items) => {
      if (controller.signal.aborted) return
      setMemos(items.map((memo) => ({ ...memo, summaryDraft: memo.summary, summaryDirty: false })))
      setSelectedId(items[0]?.id ?? null)
      setList({ status: 'ready', error: null })
    }).catch((error) => {
      if (!controller.signal.aborted) setList({ status: 'error', error })
    })
    return () => controller.abort()
  }, [loadRetry])

  useEffect(() => {
    if (!selectedId || selectedId.startsWith('draft:')) return
    const controller = new AbortController()
    memoApi.getMemo(selectedId, { signal: controller.signal }).then((memo) => {
      if (controller.signal.aborted) return
      // 다른 메모를 다녀와도 아직 저장하지 않은 입력은 유지합니다.
      setMemos((previous) => previous.map((item) => {
        if (item.id !== memo.id) return item
        return { ...(item.dirty ? item : { ...item, ...memo }), summaryDraft: item.summaryDirty ? item.summaryDraft : memo.summary }
      }))
      setDetail({ id: selectedId, error: null })
    }).catch((error) => {
      if (!controller.signal.aborted) setDetail({ id: selectedId, error })
    })
    return () => controller.abort()
  }, [selectedId, detailRetry])

  useEffect(() => {
    if (!focusTitleRef.current) return
    focusTitleRef.current = false
    if (listRef.current) listRef.current.scrollTop = 0
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [selectedId])

  useEffect(() => () => clearTimeout(savedTimerRef.current), [])

  function resetNotice() {
    clearTimeout(savedTimerRef.current)
    setSaved(null)
    setActionError(null)
  }

  function updateCurrent(patch) {
    if (!editable) return
    resetNotice()
    setMemos((previous) => previous.map((memo) => memo.id === selectedId ? { ...memo, ...patch, dirty: true } : memo))
  }

  function updateSummary(value) {
    if (!editable) return
    resetNotice()
    setMemos((previous) => previous.map((memo) => memo.id === selectedId ? { ...memo, summaryDraft: value, summaryDirty: value !== memo.summary } : memo))
  }

  function handleSelect(memo) {
    if (mutationBusy.current || memo.id === selectedId) return
    resetNotice()
    setDetail({ id: null, error: null })
    setSelectedId(memo.id)
  }

  function handleAddMemo() {
    if (mutationBusy.current || list.status !== 'ready') return
    resetNotice()
    const memo = { id: `draft:${crypto.randomUUID()}`, title: '새 메모', body: '', summary: '', summaryDraft: '', summaryDirty: false, isNew: true, dirty: true }
    setMemos((previous) => [memo, ...previous])
    setQuery('')
    setSelectedId(memo.id)
    focusTitleRef.current = true
  }

  async function handleSave(event) {
    event.preventDefault()
    if (mutationBusy.current || !editable || (!current.dirty && !current.isNew)) return
    mutationBusy.current = true
    setBusy(true)
    resetNotice()
    try {
      const memo = current.isNew ? await memoApi.createMemo(current) : await memoApi.updateMemo(current.id, current)
      setMemos((previous) => previous.map((item) => item.id === current.id ? { ...item, ...memo } : item))
      setSelectedId(memo.id)
      setSaved('memo')
      savedTimerRef.current = setTimeout(() => setSaved(null), 1600)
    } catch (error) { setActionError(error) }
    finally { mutationBusy.current = false; setBusy(false) }
  }

  async function handleSaveSummary() {
    if (mutationBusy.current || !editable || current.isNew || !current.summaryDirty) return
    mutationBusy.current = true
    setBusy(true)
    resetNotice()
    try {
      const summary = await memoApi.saveSummary(current.id, current.summaryDraft)
      setMemos((previous) => previous.map((memo) => memo.id === current.id ? { ...memo, summary, summaryDraft: summary, summaryDirty: false } : memo))
      setSaved('summary')
      savedTimerRef.current = setTimeout(() => setSaved(null), 1600)
    } catch (error) { setActionError(error) }
    finally { mutationBusy.current = false; setBusy(false) }
  }

  async function handleDeleteMemo(memo) {
    if (mutationBusy.current || !window.confirm('이 메모를 삭제할까요?')) return
    mutationBusy.current = true
    setBusy(true)
    resetNotice()
    try {
      if (!memo.isNew) await memoApi.deleteMemo(memo.id)
      const index = memos.findIndex((item) => item.id === memo.id)
      const remaining = memos.filter((item) => item.id !== memo.id)
      setMemos(remaining)
      if (memo.id === selectedId) {
        setDetail({ id: null, error: null })
        setSelectedId((remaining[index] ?? remaining[index - 1])?.id ?? null)
      }
    } catch (error) { setActionError(error) }
    finally { mutationBusy.current = false; setBusy(false) }
  }

  function retryLoad() {
    setActionError(null)
    if (list.error) {
      setList({ status: 'loading', error: null })
      setLoadRetry((value) => value + 1)
    } else {
      setDetail({ id: null, error: null })
      setDetailRetry((value) => value + 1)
    }
  }

  return (
    <div className="memo-page">
      <form id="memo-editor" className="memo-board" onSubmit={handleSave} aria-label="메모 편집">
        {problem && <div className="memo-error" role="alert">
          <p>{problem.message || '요청을 처리하지 못했어요. 다시 시도해 주세요.'}</p>
          {!getToken() ? <Link to="/islogin" state={{ from: '/memo' }}>로그인하기</Link> : (detailError || list.error) && <button type="button" className="memo-retry" onClick={retryLoad}>다시 시도</button>}
        </div>}
        <input
          ref={titleRef}
          className="memo-title-input"
          type="text"
          aria-label="메모 제목"
          value={current?.title ?? ''}
          onChange={(event) => updateCurrent({ title: event.target.value })}
          placeholder="제목"
          disabled={!editable}
        />
        <textarea
          className="memo-board-input"
          aria-label="메모 내용"
          value={current?.body ?? ''}
          onChange={(event) => updateCurrent({ body: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
              event.preventDefault()
              event.currentTarget.form.requestSubmit()
            }
          }}
          placeholder="여기에 자유롭게 메모하세요 (5자 이상)"
          disabled={!editable}
        />
        <div className="memo-board-actions">
          <span role="status">{list.status === 'loading' || loadingDetail ? '메모를 불러오는 중이에요.' : saved === 'memo' ? '메모가 저장되었습니다.' : ''}</span>
          <button type="submit" className="memo-save" disabled={!editable || (!current?.dirty && !current?.isNew)}>메모 저장</button>
        </div>
      </form>
      <div className="memo-side">
        <div className="memo-header">
          <h2>메모</h2>
          <button type="button" className="memo-plus" aria-label="새 메모 추가" onClick={handleAddMemo} disabled={busy || list.status !== 'ready' || !getToken()}>+</button>
        </div>
        <div className="memo-list-box">
          <input className="memo-search" type="search" aria-label="메모 검색" placeholder="메모 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="memo-list" ref={listRef} aria-label="메모 목록" aria-busy={list.status === 'loading'}>
            {list.status === 'loading' && <p className="memo-empty">메모를 불러오는 중이에요.</p>}
            {list.status === 'ready' && memos.length === 0 && <p className="memo-empty">메모가 없어요. + 버튼으로 새 메모를 추가해 보세요.</p>}
            {list.status === 'ready' && memos.length > 0 && filteredMemos.length === 0 && <p className="memo-empty">검색 결과가 없어요.</p>}
            {filteredMemos.map((memo) => (
              <div key={memo.id} className={`memo-item${memo.id === selectedId ? ' selected' : ''}`}
                role="button" aria-label={`${memo.title || '제목 없음'} 메모 열기`} aria-pressed={memo.id === selectedId} aria-disabled={busy} tabIndex={busy ? -1 : 0}
                onClick={() => handleSelect(memo)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleSelect(memo) }
                }}>
                <div className="memo-item-top">
                  <p className="memo-item-title">{memo.title || '제목 없음'}</p>
                  <button type="button" className="memo-delete" aria-label={`${memo.title || '제목 없음'} 삭제`} disabled={busy}
                    onClick={(event) => { event.stopPropagation(); handleDeleteMemo(memo) }}>삭제</button>
                </div>
                {memo.summary && <p className="memo-item-summary">{memo.summary}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="memo-detail">
          <div className="memo-detail-top"><label className="memo-badge" htmlFor="memo-summary">한줄 요약</label></div>
          <textarea id="memo-summary" className="memo-textarea" value={current?.summaryDraft ?? ''} disabled={!editable} onChange={(event) => updateSummary(event.target.value)}
            placeholder="한줄 요약을 직접 입력하세요" aria-describedby="memo-save-help" onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); handleSaveSummary() }
            }} />
          <p id="memo-save-help" className="memo-save-help">{current?.isNew ? '메모를 먼저 저장한 후 한줄 요약을 저장해 주세요.' : '한줄 요약은 현재 브라우저에 별도로 저장됩니다.'}</p>
          <span className="memo-summary-status" role="status">{saved === 'summary' ? '한줄 요약이 저장되었습니다.' : ''}</span>
          <button type="button" className="memo-save memo-summary-save" onClick={handleSaveSummary} disabled={!editable || current?.isNew || !current?.summaryDirty}>{saved === 'summary' ? '저장됨' : '저장'}</button>
        </div>
      </div>
    </div>
  )
}

export default Memo
