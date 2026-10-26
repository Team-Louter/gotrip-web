                                
                                
import '../styles/payForm.css'
import gotripwallet from '../icons/wallet.png'

function PayForm() {
  return(
    <div>
      

      <div className="pay-card">
        <h2 className='lets-pay'><img className="gotrip-wallet"  src={gotripwallet} alt="wallet-image" /> 정산</h2>
      
        <div className='total-pay'>
          <p id='total-usepay'>총 사용액</p>
          <p id='total-money'>586,000원</p>
          <p id='expec-pay'>1인 예상 부담액:293,000원</p>
        </div>

        <div>
          <div className="pay-row">
            <input className="pay-input" type="text" placeholder="품목" />
            <input className="pay-money" type="text" placeholder="금액" />
            <button className="pay-add">추가</button>
            <button className="pay-edit">수정</button>
            <button className="pay-delete">삭제</button>
          </div>

          <div className='budget-pay'>
            <div className="pay-item">
              <span className="pay-name">항공권</span>
              <span className="pay-item-money">320,000원</span>
              <span className="pay-who">커리 도둑</span>
              <span className="pay-check">✓</span>
            </div>

            <div className="pay-item">
              <span className="pay-name">라멘 식사</span>
              <span className="pay-item-money">56,000원</span>
              <span className="pay-who">나</span>
              <span className="pay-check">✓</span>
            </div>

            <div className="green-item">
              <span className="pay-name">숙소 예약금</span>
              <span className="pay-item-money">210,000원</span>
              <span className="pay-who">곤니치와~</span>
              <span className="pay-check2">✓</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PayForm
                            