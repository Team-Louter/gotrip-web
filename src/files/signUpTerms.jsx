import gotriplogo2 from '../images/gotrip-logo2.png';
import gotriplogotext from '../images/gotrip-logotext.png';
import gotripbackground from '../images/gotrip-join.jpeg';
import { useNavigate } from 'react-router-dom';
import '../styles/signUpTerms.css'


function SignUpTerms() {
  const navigate = useNavigate();
  return(
    <div className='login-container2'>
      <div className='login-left2'>
        <div className='service-start2'>
          <img src={gotriplogo2} alt="gotrip-logo2" className='gotrip-logo2'/>
          <img src={gotriplogotext} alt="gotrip-logotext" className='gotrip-logotext'/>
          <h2>약관 동의서</h2>
        </div>
    
        <div className='first-check2'>

          <div className='lets-agree'>
            <div className='agree-wrapper2'>
              <div className='agree-box2'>
                <div className='lets-check2'>
                  <input className='check-agree' type="checkbox" />
                  <h4>전체 동의 하기</h4>
                </div>
              </div>

              <div className='agree-box2'>
                <div className='lets-check2'>      
                  <input className='check-agree' type="checkbox" />
                  <h4>개인정보 수집 및 이용 동의 <span className='first-check'>(필수)</span></h4>
                </div>

                <div className='personal-information2'>
                  <h4>개인정보 수집 이용 동의서</h4>
                  <p>
개인정보 보호법 제15조제1항제4호(계약 체결/이행)에 따라, 아래와 같이 개인정보를 수집·이용합니다.
  네이버 회원가입 시 하나의 계정으로 전체 네이버 서비스 이용이 가능하며, 여기에는 네이버에서 제공하는 개인 맞춤형 서비스와 인공지능(AI) 서비스가 포함됩니다.

  1. 수집하는 개인정보 항목
  회원 가입 시
  아이디, 비밀번호, 이름 생년월일, 성별, 휴대전화번호, 이메일 주소(본인확인 이메일 주소 등록 시), 프로필 정보(별명(등록하지 않은 경우 아이디 일부를 마스킹하여 자동 입력), 프로필 사진)
  단체 아이디 가입 시
  단체 아이디, 비밀번호, 단체이름, 이메일 주소, 휴대전화번호
  비밀번호 없이 로그인/회원 가입 시
  아이디, 이름, 생년월일, 휴대전화번호, 비밀번호(다른 기기 이용을 위해 비밀번호를 입력하는 경우)
  회원가입 과정에서 본인 인증 완료 시
  연계정보(CI), 중복가입 확인정보(DI), 내외국인 정보
  서비스 이용 시
  IP주소, 쿠키, 서비스 이용 기록, 기기정보, 위치정보, 이미지 및 음성 정보(이미지나 음성을 이용한 서비스를 이용하는 경우)
  만 14세 미만 아동 법정대리인 동의 시
  법정대리인의 정보(법정대리인의 이름, 중복가입확인정보(DI), 휴대전화번호(아이핀 인증인 경우 아이핀 번호)

  위 내용 외에 개별 네이버 서비스 제공 과정에서 개인정보 처리가 필요할 경우, 해당 서비스 이용자 대상으로 개인정보를 추가로 수집ㆍ이용할 수 있으며, 이에 대해서는 개인정보 처리방침에서 상세히 공개하고 있습니다.

  2. 수집 및 이용목적
  회원 관리를 위하여 개인정보를 이용합니다.
  회원 가입 의사의 확인, 연령 확인 및 법정대리인 동의 진행, 이용자 및 법정대리인의 본인 확인, 이용자 식별, 회원탈퇴 의사의 확인 등 회원관리를 위하여 개인정보를 이용합니다.
  이용자 보호 및 안전한 서비스 이용환경 구축을 위하여 개인정보를 이용합니다.
  법령 및 네이버 이용약관을 위반하는 회원에 대한 이용 제한 조치, 부정 이용 행위를 포함하여 서비스의 원활한 운영에 지장을 주는 행위 방지 및 제재, 계정도용 및 부정거래 방지, 보안ㆍ프라이버시ㆍ안전 측면에서 이용자가 안심하고 이용할 수 있는 서비스 이용환경 구축을 위해 개인정보를 이용합니다.
  서비스 제공과 운영을 위하여 개인정보를 이용합니다.
  약관 개정 등의 고지사항 전달, 분쟁조정을 위한 기록 보존, 민원처리 등 서비스 운영을 위하여 개인정보를 이용합니다. 또한 검색 결과를 포함한 기존 네이버 콘텐츠 및 서비스(광고 포함) 제공을 위해 개인정보를 이용하며, 이용자에게 유용한 이벤트 정보와 참여 기회 제공, 마케팅·프로모션을 목적으로도 개인정보를 이용합니다. 단, 마케팅·프로모션 과정에서의 개인정보 처리는 필요할 경우, 관련 법령에 따라 이용자의 별도 동의를 받고 진행합니다.
  유료 서비스 제공을 위하여 개인정보를 이용합니다.
  유료 서비스 제공에 따르는 본인인증, 요금 결제 및 정산, 세금계산서 발행 등 세법 상 필요한 제반 업무 처리, 상품 및 서비스의 배송, 채권추심을 위하여 개인정보를 이용합니다.
  서비스 개선, 기술 개발, 신규 서비스 요소의 발굴, 서비스 경험 향상을 위하여 개인정보를 이용합니다.
  기존에 제공 중인 서비스를 개선하고, 더 나은 서비스를 제공하기 위한 기술 개발ㆍ신규 서비스 요소의 발굴 등을 위하여 개인정보를 이용합니다. 또한, 서비스 제공에 따른 효과 분석, 그리고 서비스 품질 및 사용자 경험 향상을 위한 목적으로 개인정보를 이용합니다.
  콘텐츠와 광고를 포함한 맞춤 서비스 제공을 위하여 개인정보를 이용합니다.
  개인정보 및 관심에 기반하여 이용자간 네트워크 형성을 지원하며, 지인 및 관심사 등에 기반한 맞춤형 서비스를 제공합니다. 맞춤 서비스 제공을 위하여 서비스 이용기록을 분석하고 통계 처리를 하며, 분석 결과에 기반하여 개인별로 유용한 맞춤 콘텐츠ㆍ서비스를 추천하고 검색 결과를 제공합니다. 또한 이용자에게 정보로서 가치있는 개인 맞춤 광고를 제공 및 표시하는 데에 개인정보를 이용합니다.
  네이버 서비스 제공 및 개선, 새로운 기술 개발과 신규 서비스 요소의 발굴, 서비스 경험 향상, 개인 맞춤형 서비스(광고 포함) 제공 등 네이버 서비스 전반에 인공지능(AI) 기술이 적용되며, 인공지능 기술 개발을 위하여 개인정보를 이용합니다.

  3. 개인정보의 보유기간
  네이버는 개인정보의 이용목적이 달성되면 개인정보를 지체없이 파기하고 있습니다.

  자세한 내용은 개인정보 처리방침에서 확인하실 수 있습니다.
                  </p>
                </div>
              </div>

              <div className='login-button2'>
                <button>동의합니다.</button>
              </div>

              <div className='ifyou-not2'>
                <p>이미 계정이 있으신가요? <span className='lets-signup2' onClick={() => navigate('/islogin')}  style={{ cursor: 'pointer' }}>로그인</span></p>
              </div>
            </div>
          </div>
          

        </div>

       </div>

       <div className="login-right2">
         <img src={gotripbackground} alt="background" className='gotrip-background2'/>
       </div>

      
      
      
     
      
      
    </div>
  )
}

export default SignUpTerms
                            