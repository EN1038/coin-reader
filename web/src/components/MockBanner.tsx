import { useApp } from '../context/AppContext';

export function MockBanner({ children }: { children?: React.ReactNode }) {
  const { isMock } = useApp();
  if (!isMock) return null;
  return (
    <div className="mock-banner">
      {children ?? 'โหมด mock · ไม่มีการชำระเงินจริง · ไม่มี QR PromptPay'}
    </div>
  );
}
