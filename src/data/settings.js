const startPageKey = 'gotrip.settings.startPage';

export const startPages = [
  { path: '/main', label: '홈' },
  { path: '/calendar', label: '캘린더' },
  { path: '/memo', label: '메모' },
  { path: '/pay', label: '정산' },
];

export function getStartPage() {
  const savedPage = localStorage.getItem(startPageKey);
  return startPages.find(({ path }) => path === savedPage)?.path ?? '/main';
}

export function saveStartPage(path) {
  localStorage.setItem(startPageKey, path);
}
