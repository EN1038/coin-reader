export function Badge({
  kind, children,
}: {
  kind?: 'free' | 'lock' | 'note' | 'ok' | 'danger' | 'ex';
  children: React.ReactNode;
}) {
  const cls = kind ? `badge badge-${kind}` : 'badge';
  return <span className={cls}>{children}</span>;
}

export function ExampleBadge() {
  return <Badge kind="ex">ตัวอย่าง</Badge>;
}
