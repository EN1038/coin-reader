import { Navigate } from 'react-router-dom';

export function HistoryPage() {
  return <Navigate to="/library?tab=history" replace />;
}
