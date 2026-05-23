import { useMemo } from 'react';
import { demoFiles } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { buildFileTree } from './workbenchTesting';
import type { FileTreeNode } from './workbenchTesting';
import { WorkbenchHeader, SourceBadge } from './WorkbenchHeader';
import { FilePreview } from './FilePreview';

function FileTreeRow({
  node,
  depth,
  onSelect,
  selectedId,
}: {
  node: FileTreeNode;
  depth: number;
  onSelect: (fileId: string) => void;
  selectedId: string | null;
}) {
  const isSelected = node.fileId === selectedId;
  const isFolder = node.kind === 'folder';

  return (
    <>
      <div
        className={`flex items-center gap-2 px-2 py-1 text-xs cursor-pointer rounded transition-colors ${
          isSelected ? 'bg-cyber-accent/15 text-cyber-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (node.fileId) onSelect(node.fileId);
        }}
      >
        <span className="text-gray-500 w-4 text-center">{isFolder ? '📁' : '📄'}</span>
        <span className="truncate">{node.name}</span>
      </div>
      {node.children.map((child) => (
        <FileTreeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </>
  );
}

export function FilesView() {
  const getTask = useOfficeStore((s) => s.getTask);
  const selectTask = useUIStore((s) => s.selectTask);
  const selectAgent = useUIStore((s) => s.selectAgent);
  const selectedFileId = useDashboardStore((s) => s.selectedFileId);
  const setSelectedFile = useDashboardStore((s) => s.setSelectedFile);

  const tree = useMemo(() => buildFileTree(demoFiles), []);
  const selectedFile = useMemo(() => demoFiles.find((f) => f.id === selectedFileId), [selectedFileId]);

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="Files" subtitle="Workspace tree with preview and task provenance." />

      <div className="flex gap-4 min-h-0" style={{ height: 'calc(100% - 60px)' }}>
        {/* File tree column */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-cyber-border pr-3">
          {tree.map((root) => (
            <FileTreeRow
              key={root.id}
              node={root}
              depth={0}
              onSelect={setSelectedFile}
              selectedId={selectedFileId}
            />
          ))}
        </div>

        {/* Preview column */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <FilePreview file={selectedFile} />

          {/* Provenance */}
          {selectedFile && (
            <div className="mt-3 space-y-1">
              {selectedFile.sourceTaskId && (
                <button
                  className="cyber-btn text-xs w-full text-left"
                  onClick={() => selectTask(selectedFile.sourceTaskId!)}
                >
                  Task: {getTask(selectedFile.sourceTaskId)?.title || selectedFile.sourceTaskId}
                </button>
              )}
              {selectedFile.sourceAgentId && (
                <button
                  className="cyber-btn text-xs w-full text-left"
                  onClick={() => selectAgent(selectedFile.sourceAgentId!)}
                >
                  Agent: {selectedFile.sourceAgentId}
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                <span>{selectedFile.size}</span>
                <span>{new Date(selectedFile.updatedAt).toLocaleDateString('zh-CN')}</span>
                <SourceBadge source={selectedFile.source} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
