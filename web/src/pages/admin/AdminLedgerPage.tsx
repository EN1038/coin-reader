import { Badge } from '../../components/Badge';
import { AdminPageHeader } from '../../components/AdminModal';
import { mockDb } from '../../lib/mock/store';

export function AdminLedgerPage() {
  const ledger = mockDb.getState().ledger;
  return (
    <div className="admin-page">
      <AdminPageHeader
        title="ธุรกรรม Gold"
        desc="อ่านอย่างเดียวจาก mock store · client ไม่เขียน ledger โดยตรงใน flow ผู้อ่าน"
      />
      <div className="card admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>รายการ</th>
              <th>ชนิด</th>
              <th>เวลา</th>
              <th style={{ textAlign: 'right' }}>จำนวน</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((e) => (
              <tr key={e.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{e.label}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{e.transaction_id}</div>
                </td>
                <td><Badge kind="ex">{e.kind}</Badge></td>
                <td className="muted" style={{ fontSize: 12 }}>{new Date(e.created_at).toLocaleString('th-TH')}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: e.amount >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                  {e.amount >= 0 ? '+' : ''}{e.amount}
                </td>
              </tr>
            ))}
            {!ledger.length && (
              <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>ว่าง</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
