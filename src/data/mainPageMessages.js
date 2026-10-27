export const mainPageMessages = [
  { id: 1, text: "여행하기 딱 좋은 날씨네요 ☀️" },
  { id: 2, text: "집 밖은 위험해요. 근데 여행은 안전해요 😎" },
  { id: 3, text: "통장은 잠깐 잊고, 일단 떠나 볼까요? ✈️" },
  { id: 4, text: "가방은 아직 비었지만 마음은 이미 공항이에요 🧳" },
];

export const getRandomMessage = () =>
  mainPageMessages[Math.floor(Math.random() * mainPageMessages.length)];