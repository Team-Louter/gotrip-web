import { useLayoutEffect, useRef, useState } from 'react';
import '../styles/payForm.css';
import Toast, { useToast } from '../components/Toast';
import gotripwallet from '../icons/wallet.png';

const initialExpenses = [
  { id: 1, name: '항공권', amount: 320000 },
  { id: 2, name: '라멘 식사', amount: 56000 },
  { id: 3, name: '숙소 예약금', amount: 210000 },
];

const GROUPS_KEY = 'gotrip.settlement.groups.v1';

function readGroups() {
  try {
    const groups = JSON.parse(localStorage.getItem(GROUPS_KEY));
    return Array.isArray(groups) ? groups : [];
  } catch {
    return [];
  }
}

function expenseError(name, amount) {
  if (!name.trim()) return '품목을 입력해주세요.';
  if (!amount.trim()) return '금액을 입력해주세요.';
  if (!/^\d+$/.test(amount)) return '금액칸에는 숫자만 입력해주세요.';
  if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) return '금액을 1원 이상 입력해주세요. 금액이 너무 크지 않은지 확인해주세요.';
  return '';
}

function PayForm() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [notice, notify] = useToast();
  const [groups, setGroups] = useState(readGroups);
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupSize, setGroupSize] = useState('');
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

  const group = groups.find((entry) => entry.id === groupId);
  const share = group ? Math.floor(total / group.size) : 0;
  const remainder = group ? total % group.size : 0;

  function addGroup(event) {
    event.preventDefault();
    const name = groupName.trim();
    const size = Number(groupSize);
    if (!name) return notify('그룹 이름을 입력해주세요.');
    if (!/^\d+$/.test(groupSize) || !Number.isSafeInteger(size) || size < 2) {
      return notify('정산 인원을 2명 이상의 숫자로 입력해주세요.');
    }
    if (groups.some((entry) => entry.name === name)) return notify('이미 같은 이름의 그룹이 있어요.');

    const newGroup = { id: crypto.randomUUID(), name, size };
    const nextGroups = [...groups, newGroup];
    try {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(nextGroups));
    } catch {
      return notify('그룹을 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.');
    }
    setGroups(nextGroups);
    setGroupId(newGroup.id);
    setGroupName('');
    setGroupSize('');
    notify('정산 그룹을 추가했어요.', 'success');
  }

  const addExpense = () => {
    const error = expenseError(itemName, itemAmount);
    if (error) return notify(error);
    const amount = Number(itemAmount);
    if (!Number.isSafeInteger(total + amount)) return notify('총 사용액이 너무 커요. 금액을 확인해주세요.');

    scrollToNewExpense.current = true;
    setExpenses((current) => [
      ...current,
      { id: Date.now(), name: itemName.trim(), amount },
    ]);
    setItemName('');
    setItemAmount('');
    notify('품목을 추가했어요.', 'success');
  };

  const openEditDialog = (expense) => {
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
    setDialog({ type: 'edit', id: expense.id });
  };

  const confirmEditExpense = () => {
    const error = expenseError(editName, editAmount);
    if (error) return notify(error);
    const amount = Number(editAmount);
    const previous = expenses.find((expense) => expense.id === dialog.id);
    if (!Number.isSafeInteger(total - previous.amount + amount)) return notify('총 사용액이 너무 커요. 금액을 확인해주세요.');

    setExpenses((current) => current.map((expense) => (
      expense.id === dialog.id
        ? { ...expense, name: editName.trim(), amount }
        : expense
    )));
    setDialog(null);
    notify('품목을 수정했어요.', 'success');
  };

  const confirmDeleteExpense = () => {
    setExpenses((current) => current.filter((expense) => expense.id !== dialog.id));
    setDialog(null);
    notify('품목을 삭제했어요.', 'success');
  };

  return (
    <div className="pay-page">
      <Toast notice={notice} />

      <div className="pay-card">
        <h2 className="lets-pay">
          <img className="gotrip-wallet" src={gotripwallet} alt="" /> 정산
        </h2>

        <div className="total-pay">
          <p id="total-usepay">총 사용액</p>
          <p id="total-money">{formatWon(total)}</p>
          <label htmlFor="settlement-group">정산 그룹</label>
          <select id="settlement-group" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value="">그룹 선택</option>
            {groups.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} ({entry.size}명)</option>)}
          </select>
          <p id="expec-pay">{group ? `1인 부담액: ${formatWon(share)}` : '정산할 그룹을 선택해주세요.'}</p>
          {remainder > 0 && <p className="pay-remainder">{remainder}명은 1원씩 더 부담해요.</p>}
        </div>

        <details className="pay-groups">
          <summary>새 정산 그룹 만들기</summary>
          <form className="pay-group-form" onSubmit={addGroup}>
            <input aria-label="그룹 이름" placeholder="그룹 이름" value={groupName} onChange={(event) => setGroupName(event.target.value)} />
            <input aria-label="정산 인원" inputMode="numeric" placeholder="인원수" value={groupSize} onChange={(event) => setGroupSize(event.target.value)} />
            <button className="pay-add" type="submit">그룹 추가</button>
          </form>
        </details>

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
            type="text"
            inputMode="numeric"
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
                  type="text"
                  inputMode="numeric"
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
