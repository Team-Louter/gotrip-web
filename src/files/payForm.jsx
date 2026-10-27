import { useState } from 'react';
import '../styles/payForm.css';
import gotripwallet from '../icons/wallet.png';

const initialExpenses = [
  { id: 1, name: '항공권', amount: 320000, payer: '커리 도둑' },
  { id: 2, name: '라멘 식사', amount: 56000, payer: '나' },
  { id: 3, name: '숙소 예약금', amount: 210000, payer: '곤니치와~' },
];

function PayForm() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [notice, setNotice] = useState(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

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

    setExpenses((current) => [
      ...current,
      { id: Date.now(), name: itemName.trim(), amount, payer: '나' },
    ]);
    setItemName('');
    setItemAmount('');
    showNotice('success', '추가 되었습니다!');
  };

  const toggleExpense = (id) => {
    setSelectedExpenseIds((current) => (
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    ));
  };

  const openEditDialog = () => {
    if (selectedExpenseIds.length === 0) {
      showNotice('error', '수정할 항목을 선택해주세요.');
      return;
    }
    const firstSelected = expenses.find((expense) => expense.id === selectedExpenseIds[0]);
    setEditName(firstSelected?.name ?? '');
    setEditAmount(String(firstSelected?.amount ?? ''));
    setDialog({ type: 'edit' });
  };

  const confirmEditExpenses = () => {
    const amount = Number(editAmount);
    if (!editName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setDialog(null);
      showNotice('error', '수정에 실패했습니다.');
      return;
    }

    setExpenses((current) => current.map((expense) => (
      selectedExpenseIds.includes(expense.id)
        ? { ...expense, name: editName.trim(), amount }
        : expense
    )));
    setDialog(null);
    showNotice('success', '수정되었습니다.');
  };

  const openDeleteDialog = () => {
    if (selectedExpenseIds.length === 0) {
      showNotice('error', '삭제할 항목을 선택해주세요.');
      return;
    }
    setDialog({ type: 'delete' });
  };

  const confirmDeleteExpenses = () => {
    setExpenses((current) => current.filter((expense) => !selectedExpenseIds.includes(expense.id)));
    setSelectedExpenseIds([]);
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
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addExpense()}
          />
          <input
            className="pay-money"
            type="number"
            min="1"
            placeholder="금액"
            value={itemAmount}
            onChange={(event) => setItemAmount(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addExpense()}
          />
          <button className="pay-add" type="button" onClick={addExpense}>추가</button>
          <button className="pay-edit" type="button" onClick={openEditDialog}>수정</button>
          <button className="pay-delete" type="button" onClick={openDeleteDialog}>삭제</button>
        </div>

        <div className="budget-pay">
          {expenses.map((expense) => {
            const isSelected = selectedExpenseIds.includes(expense.id);
            return (
              <div
                className={`pay-item${isSelected ? ' green-item' : ''}`}
                key={expense.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => toggleExpense(expense.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleExpense(expense.id);
                  }
                }}
              >
                <span className="pay-name">{expense.name}</span>
                <span className="pay-item-money">{formatWon(expense.amount)}</span>
                <span className="pay-who">{expense.payer}</span>
                <span className={isSelected ? 'pay-check2' : 'pay-check'}>✓</span>
              </div>
            );
          })}
        </div>
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
              <p className="pay-delete-confirm">선택한 {selectedExpenseIds.length}개 항목을 삭제하시겠습니까?</p>
            )}
            <div className="pay-modal-actions">
              <button type="button" className="pay-modal-cancel" onClick={() => setDialog(null)}>취소</button>
              <button
                type="button"
                className={`pay-modal-confirm${dialog.type === 'delete' ? ' is-delete' : ''}`}
                onClick={dialog.type === 'edit' ? confirmEditExpenses : confirmDeleteExpenses}
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
