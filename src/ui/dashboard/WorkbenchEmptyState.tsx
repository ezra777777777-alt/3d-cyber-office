export function WorkbenchEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: string;
}) {
  return (
    <div className="workbench-empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
      {action && <small>{action}</small>}
    </div>
  );
}
