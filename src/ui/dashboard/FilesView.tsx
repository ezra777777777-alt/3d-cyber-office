import { demoFiles } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';

export function FilesView() {
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-cyber-accent mb-4">Files</h2>

      <div className="space-y-1">
        {demoFiles.map((file) => {
          const task = file.sourceTaskId ? getTask(file.sourceTaskId) : undefined;
          return (
            <div
              key={file.id}
              className="flex items-center gap-4 px-3 py-2 hover:bg-white/5 rounded cursor-pointer transition-colors"
              onClick={() => {
                if (file.sourceTaskId) selectTask(file.sourceTaskId);
              }}
            >
              <span className="text-gray-500 text-lg w-6 text-center">&#128196;</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{file.name}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>{file.size}</span>
                  <span>{file.path}</span>
                  <span>{new Date(file.updatedAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              {task && (
                <span className="text-xs text-cyber-accent border border-cyber-accent/20 rounded px-2 py-0.5">
                  {task.title.slice(0, 20)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {demoFiles.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">No files</div>
      )}
    </div>
  );
}
