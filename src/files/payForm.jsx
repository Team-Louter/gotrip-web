import { useLayoutEffect, useRef, useState } from 'react';
import '../styles/payForm.css';
import { showErrorToast, showSuccessToast } from '../components/AppToasts';
import { readSettlements, savedExpenses, saveSettlements } from '../data/settlements.js';
import { readFriendGroups } from '../data/friendGroups.js';
import gotripwallet from '../icons/wallet.png';
import { useNavigate } from 'react-router-dom';

function expenseError(name, amount) {
  if (!name.trim()) return '품목을 입력해주세요.';
  if (!amount.trim()) return '금액을 입력해주세요.';
  if (!/^\d+$/.test(amount)) return '금액칸에는 숫자만 입력해주세요.';
  if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) return '금액을 1원 이상 입력해주세요. 금액이 너무 크지 않은지 확인해주세요.';
  return '';
}

function groupSize(group) {
  return new Set(group.friendIds.map(String)).size;
}

function PayForm() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState(() => {
    try {
      const state = readSettlements();
      const legacyManualKey = `manual:${Number(state.participantCount)}`;
      if (!Object.hasOwn(state.entries, 'manual') && Array.isArray(state.entries[legacyManualKey])) {
        try { return saveSettlements({}, 'manual', state.entries[legacyManualKey]); }
        catch { return { ...state, entries: { ...state.entries, manual: state.entries[legacyManualKey] } }; }
      }
      return state;
    }
    catch {
      return { participantCount: '2', selectedGroupId: null, entries: {} };
    }
  });
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [participantCount, setParticipantCount] = useState(settlements.participantCount);
  const [groups, setGroups] = useState(readFriendGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(settlements.selectedGroupId);
  const [dialog, setDialog] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const settlementKey = selectedGroup ? `group:${selectedGroup.id}` : 'manual';
  const expenses = savedExpenses(settlements, settlementKey);

  const listRef = useRef(null);
  const scrollToNewExpense = useRef(false);


  useLayoutEffect(() => {
    if (scrollToNewExpense.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      scrollToNewExpense.current = false;
    }
  }, [expenses.length]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const formatWon = (amount) => `${amount.toLocaleString('ko-KR')}원`;

  const participantTotal = Number(participantCount);
  const canSplit = /^\d+$/.test(participantCount) && participantTotal >= 1 && participantTotal <= 10000;
  const share = canSplit ? Math.floor(total / participantTotal) : 0;

  function persist(patch, key, nextExpenses) {
    try {
      setSettlements(saveSettlements(patch, key, nextExpenses));
      return true;
    } catch {
      showErrorToast('정산 내역을 저장하지 못했어요. 다시 시도해주세요.');
      return false;
    }
  }

  function resetInputs() {
    setItemName('');
    setItemAmount('');
    setDialog(null);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  function selectGroup(id) {
    const group = groups.find((entry) => entry.id === id);
    const nextParticipantCount = group ? String(Math.min(groupSize(group) + 1, 10000)) : participantCount;
    if (!persist({ selectedGroupId: id, participantCount: nextParticipantCount })) return;
    setSelectedGroupId(id);
    setParticipantCount(nextParticipantCount);
    resetInputs();
  }

  function openGroups() {
    navigate('/friends', { state: { initialTab: 'groups' } });
  }

  const addExpense = (event) => {
    event.preventDefault();
    const error = expenseError(itemName, itemAmount);
    if (error) return showErrorToast(error);
    const amount = Number(itemAmount);
    if (!Number.isSafeInteger(total + amount)) return showErrorToast('총 사용액이 너무 커요. 금액을 확인해주세요.');

    const expense = { id: crypto.randomUUID(), name: itemName.trim(), amount };
    if (!canSplit) return showErrorToast('정산 인원을 먼저 확인해주세요.');
    if (!persist({}, settlementKey, [...expenses, expense])) return;
    scrollToNewExpense.current = true;
    setItemName('');
    setItemAmount('');
    showSuccessToast('품목을 추가했어요.');
  };

  const openEditDialog = (expense) => {
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
    setDialog({ type: 'edit', id: expense.id });
  };

  const confirmEditExpense = () => {
    const error = expenseError(editName, editAmount);
    if (error) return showErrorToast(error);
    const amount = Number(editAmount);
    const previous = expenses.find((expense) => expense.id === dialog.id);
    if (!Number.isSafeInteger(total - previous.amount + amount)) return showErrorToast('총 사용액이 너무 커요. 금액을 확인해주세요.');

    const nextExpenses = expenses.map((expense) => (
      expense.id === dialog.id
        ? { ...expense, name: editName.trim(), amount }
        : expense
    ));
    if (!persist({}, settlementKey, nextExpenses)) return;
    setDialog(null);
    showSuccessToast('품목을 수정했어요.');
  };

  const confirmDeleteExpense = () => {
    if (!persist({}, settlementKey, expenses.filter((expense) => expense.id !== dialog.id))) return;
    setDialog(null);
    showSuccessToast('품목을 삭제했어요.');
  };

  return (
    <main className="pay-page">
      <section className="pay-card" aria-labelledby="pay-expenses-title">
        <h1 id="pay-expenses-title" className="lets-pay">
          <img className="gotrip-wallet" src={gotripwallet} alt="" /> 정산
        </h1>

        <div className="pay-layout">
        <div className="pay-sidebar">
        <div className="pay-summary">
          <div className="pay-totals" aria-live="polite">
            <div><span>총 사용액</span><strong>{formatWon(total)}</strong></div>
            <div className="pay-share">
              <span>1인 부담액</span>
              <strong>{canSplit ? formatWon(share) : '—'}</strong>
            </div>
            {canSplit && <p className="pay-calculation">총 사용액 ÷ {participantTotal.toLocaleString('ko-KR')}명</p>}
            {!canSplit && <p className="pay-calculation">정산 인원을 1~10,000명 사이의 정수로 입력해주세요.</p>}
          </div>
        </div>
        <section className="pay-group-panel" aria-label="그룹 조회와 정산 인원">
          <div className="pay-group-heading">
            <strong>그룹</strong>
          </div>
          {groups.length === 0 ? (
            <div className="pay-group-empty">
              <p>아직 그룹이 없어요.</p>
              <button type="button" onClick={openGroups}>그룹 만들러 가기</button>
            </div>
          ) : (
            <ul className="pay-group-list" aria-label="그룹 목록">
              {groups.map((group) => (
                <li key={group.id}>
                  <button type="button" className={`pay-group-option${selectedGroup?.id === group.id ? ' is-selected' : ''}`}
                    onClick={() => selectGroup(group.id)} disabled={groupSize(group) === 0} aria-pressed={selectedGroup?.id === group.id}>
                    <span>{group.name}</span><small>{Math.min(groupSize(group) + 1, 10000)}명</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="pay-participant-display" aria-live="polite">
            <span>총 정산인원</span>
            <strong>{canSplit ? `${participantTotal.toLocaleString('ko-KR')}명` : '인원 확인 필요'}</strong>
          </div>
        </section>
        </div>

        <div className="pay-expense-panel">
          <h2 className="pay-expense-title">지출 목록</h2>
          <form className="pay-row" onSubmit={addExpense}>
            <input
              className="pay-input"
              type="text"
              placeholder="품목"
              aria-label="품목"
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
            />
            <input
              className="pay-money"
              type="text"
              inputMode="numeric"
              placeholder="금액"
              aria-label="금액"
              value={itemAmount}
              onChange={(event) => setItemAmount(event.target.value)}
            />
            <button className="pay-add" type="submit">추가</button>
          </form>
          {expenses.length === 0 && <p className="pay-empty">품목과 금액을 입력해 지출을 추가하세요.</p>}

          <ul className="budget-pay" ref={listRef} tabIndex={0} aria-label="품목 목록">
            {expenses.map((expense) => (
              <li className="pay-item" key={expense.id}>
                <span className="pay-name">{expense.name}</span>
                <span className="pay-item-money">{formatWon(expense.amount)}</span>
                <div className="pay-item-actions">
                  <button className="pay-edit" type="button" aria-label={expense.name + ' 수정'} onClick={() => openEditDialog(expense)}>수정</button>
                  <button className="pay-delete" type="button" aria-label={expense.name + ' 삭제'} onClick={() => setDialog({ type: 'delete', id: expense.id, name: expense.name })}>삭제</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </section>

      {dialog && (
        <div
          className="pay-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section className="pay-modal" role="dialog" aria-modal="true" aria-labelledby="pay-modal-title">
            <h3 id="pay-modal-title">{dialog.type === 'edit' ? '지출 수정' : '지출 삭제'}</h3>
            {dialog.type === 'edit' ? (
              <>
                <label className="pay-modal-label" htmlFor="edit-expense-name">수정할 내용을 입력하세요</label>
                <input
                  id="edit-expense-name"
                  className="pay-modal-input"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="품목"
                  autoFocus
                />
                <input
                  className="pay-modal-input"
                  type="text"
                  inputMode="numeric"
                  value={editAmount}
                  onChange={(event) => setEditAmount(event.target.value)}
                  placeholder="금액"
                  aria-label="수정할 금액"
                />
              </>
            ) : (
              <p className="pay-delete-confirm">
                ‘{dialog.name}’ 항목을 삭제하시겠습니까?
              </p>
            )}
            <div className="pay-modal-actions">
              <button type="button" className="pay-modal-cancel" onClick={() => setDialog(null)}>취소</button>
              <button
                type="button"
                className={`pay-modal-confirm${dialog.type === 'edit' ? '' : ' is-delete'}`}
                onClick={dialog.type === 'edit' ? confirmEditExpense : confirmDeleteExpense}
              >
                확인
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default PayForm;
