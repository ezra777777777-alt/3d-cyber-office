import type { FileRecord } from '@/core/types';
import { SourceBadge } from './WorkbenchHeader';

export function FilePreview({ file }: { file: FileRecord | undefined }) {
  if (!file) {
    return <div className="cyber-panel p-4 text-sm text-gray-500">选择文件以预览其工作区产物。</div>;
  }

  return (
    <section className="cyber-panel min-h-[280px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-white">{file.name}</h3>
          <p className="mt-1 text-xs text-gray-500">{file.path}</p>
        </div>
        <SourceBadge source={file.source} />
      </div>
      <div className="mt-4 rounded border border-cyber-border bg-cyber-dark/70 p-3 text-xs leading-6 text-gray-300 whitespace-pre-wrap">
        {file.preview || '此文件类型暂不支持预览。'}
      </div>
    </section>
  );
}
