import type { GatewayDiagnostic } from '@/core/types';

const SEVERITY_CLASS: Record<GatewayDiagnostic['severity'], string> = {
  info: 'border-cyber-border text-gray-300',
  warn: 'border-cyber-warning/40 text-cyber-warning',
  error: 'border-cyber-error/40 text-cyber-error',
  success: 'border-cyber-success/40 text-cyber-success',
};

export function GatewayDiagnosticsView({ diagnostics }: { diagnostics: GatewayDiagnostic[] }) {
  return (
    <div className="mt-3 grid gap-2">
      {diagnostics.map((diagnostic) => (
        <div key={diagnostic.id} className={`rounded border p-3 ${SEVERITY_CLASS[diagnostic.severity]}`}>
          <div className="text-xs font-medium">{diagnostic.title}</div>
          <p className="mt-1 text-xs leading-5 text-gray-400">{diagnostic.detail}</p>
        </div>
      ))}
    </div>
  );
}
