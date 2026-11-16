import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AppToasts.css';

export function showSuccessToast(message) {
  toast.success(message, { role: 'status' });
}

export function showErrorToast(message) {
  toast.error(message, { role: 'alert' });
}

export default function AppToasts() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3200}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      toastClassName="gotrip-toast"
    />
  );
}
