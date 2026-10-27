export const mockFriends = [
  { id: 'friend-minji', name: '김민지' },
  { id: 'friend-seoyeon', name: '이서연' },
  { id: 'friend-jihoon', name: '박지훈' },
  { id: 'friend-yujin', name: '최유진' },
  { id: 'friend-hajun', name: '정하준' },
  { id: 'friend-daeun', name: '송다은' },
];

const jejuMessages = [
  { id: 'jeju-1', content: '제주도 가는거 너무 설렌당', senderName: '김민지', mine: false, time: '16:45' },
  { id: 'jeju-2', content: '그니까 빨리 가고싶다', senderName: '나', mine: true, time: '16:45' },
  { id: 'jeju-3', content: '가서 뭐할거야?', senderName: '김민지', mine: false, time: '16:46' },
  { id: 'jeju-4', content: '요즘 한라봉이 그렇게 맛있대', senderName: '나', mine: true, time: '16:46' },
  { id: 'jeju-5', content: '한라봉 먹고오자', senderName: '김민지', mine: false, time: '16:47' },
];

export const mockRooms = [
  { id: 'jeju', name: 'team 제주도', lastMessage: '한라봉 먹고오자', members: mockFriends.slice(0, 3), messages: jejuMessages },
  { id: 'osaka', name: '오사카 맛집 여행', lastMessage: '라멘 맛집 찾았어!', members: [mockFriends[1], mockFriends[3]], messages: [] },
  { id: 'busan', name: '부산 바다 보러', lastMessage: '광안리에서 만나요', members: [mockFriends[0], mockFriends[4]], messages: [] },
  { id: 'gangneung', name: '강릉 주말 여행', lastMessage: '기차 시간 확인해 줘', members: [mockFriends[2], mockFriends[5]], messages: [] },
  { id: 'tokyo', name: '도쿄 여행 준비', lastMessage: '숙소 예약 완료!', members: [mockFriends[3], mockFriends[4]], messages: [] },
  { id: 'seoul', name: '서울 나들이', lastMessage: '이번 주말에 어디 갈까?', members: [mockFriends[0], mockFriends[5]], messages: [] },
];
