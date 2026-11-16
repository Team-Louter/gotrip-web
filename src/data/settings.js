const startPageKey = 'gotrip.settings.startPage';

export const startPages = [
  { path: '/home', label: '홈' },
  { path: '/calendar', label: '캘린더' },
  { path: '/memo', label: '메모' },
  { path: '/payment', label: '정산' },
];

export function getStartPage() {
  const savedPage = localStorage.getItem(startPageKey);
  const migratedPage = { '/main': '/home', '/pay': '/payment' }[savedPage] ?? savedPage;
  return startPages.find(({ path }) => path === migratedPage)?.path ?? '/home';
}

export function saveStartPage(path) {
  localStorage.setItem(startPageKey, path);
}
