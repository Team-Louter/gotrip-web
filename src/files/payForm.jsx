import { useLayoutEffect, useRef, useState } from 'react';
import '../styles/payForm.css';
import gotripwallet from '../icons/wallet.png';

const initialExpenses = [
  { id: 1, name: '항공권', amount: 320000 },
  { id: 2, name: '라멘 식사', amount: 56000 },
  { id: 3, name: '숙소 예약금', amount: 210000 },
];

function PayForm() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [notice, setNotice] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

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

  const showNotice = (type, text) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 2500);
  };

  // API 연동 시 각 핸들러에서 서버 요청을 보낸 뒤 성공 응답으로 목록을 갱신합니다.
  const addExpense = () => {
    const amount = Number(itemAmount);
    if (!itemName.trim() || !Number.isFinite(amount) || amount <= 0) {
      showNotice('error', '추가에 실패했습니다.');
      return;
    }

    scrollToNewExpense.current = true;
    setExpenses((current) => [
      ...current,
      { id: Date.now(), name: itemName.trim(), amount },
    ]);
    setItemName('');
    setItemAmount('');
    showNotice('success', '추가 되었습니다!');
  };

  const openEditDialog = (expense) => {
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
    setDialog({ type: 'edit', id: expense.id });
  };

  const confirmEditExpense = () => {
    const amount = Number(editAmount);
    if (!editName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setDialog(null);
      showNotice('error', '수정에 실패했습니다.');
      return;
    }

    setExpenses((current) => current.map((expense) => (
      expense.id === dialog.id
        ? { ...expense, name: editName.trim(), amount }
        : expense
    )));
    setDialog(null);
    showNotice('success', '수정되었습니다.');
  };

  const confirmDeleteExpense = () => {
    setExpenses((current) => current.filter((expense) => expense.id !== dialog.id));
    setDialog(null);
    showNotice('success', '삭제되었습니다.');
  };

  return (
    <div className="pay-page">
      {notice && (
        <div className={`pay-notice pay-notice-${notice.type}`} role="status">
          {notice.text}
        </div>
      )}

      <div className="pay-card">
        <h2 className="lets-pay">
          <img className="gotrip-wallet" src={gotripwallet} alt="" /> 정산
        </h2>

        <div className="total-pay">
          <p id="total-usepay">총 사용액</p>
          <p id="total-money">{formatWon(total)}</p>
          <p id="expec-pay">1인 예상 부담액: {formatWon(Math.round(total / 2))}</p>
        </div>

        <div className="pay-row">
          <input
            className="pay-input"
            type="text"
            placeholder="품목"
            aria-label="품목"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addExpense()}
          />
          <input
            className="pay-money"
            type="number"
            min="1"
            placeholder="금액"
            aria-label="금액"
            value={itemAmount}
            onChange={(event) => setItemAmount(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addExpense()}
          />
          <button className="pay-add" type="button" onClick={addExpense}>추가</button>
        </div>

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

      {dialog && (
        <div
          className="pay-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section className="pay-modal" role="dialog" aria-modal="true" aria-labelledby="pay-modal-title">
            <h3 id="pay-modal-title">gotrip</h3>
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
                  type="number"
                  min="1"
                  value={editAmount}
                  onChange={(event) => setEditAmount(event.target.value)}
                  placeholder="금액"
                  aria-label="수정할 금액"
                />
              </>
            ) : (
              <p className="pay-delete-confirm">‘{dialog.name}’ 항목을 삭제하시겠습니까?</p>
            )}
            <div className="pay-modal-actions">
              <button type="button" className="pay-modal-cancel" onClick={() => setDialog(null)}>취소</button>
              <button
                type="button"
                className={`pay-modal-confirm${dialog.type === 'delete' ? ' is-delete' : ''}`}
                onClick={dialog.type === 'edit' ? confirmEditExpense : confirmDeleteExpense}
              >
                확인
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PayForm;
