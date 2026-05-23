import { useMemo } from 'react';
import { demoFiles } from '@/data/demoSchedules';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useCommanderStore } from '@/store/commanderStore';
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
  const selectedArtifactId = useDashboardStore((s) => s.selectedArtifactId);
  const setSelectedArtifactId = useDashboardStore((s) => s.setSelectedArtifactId);
  const artifacts = useCommanderStore((state) => state.artifacts);
  const workers = useCommanderStore((state) => state.workers);

  const tree = useMemo(() => buildFileTree(demoFiles), []);

  const selectedFile = useMemo(() => {
    if (selectedFileId) return demoFiles.find((f) => f.id === selectedFileId);
    return undefined;
  }, [selectedFileId]);

  const selectedArtifact = selectedArtifactId ? artifacts[selectedArtifactId] : undefined;

  const artifactList = useMemo(
    () => Object.values(artifacts).filter(Boolean),
    [artifacts],
  );

  return (
    <div className="workbench-page">
      <WorkbenchHeader title="文件产物" subtitle="浏览产物、版本、来源和关联任务。" />

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

          {/* Commander artifacts section */}
          {artifactList.length > 0 && (
            <div className="mt-4 pt-3 border-t border-cyber-border">
              <span className="text-[10px] text-gray-500 px-2">Commander 产物</span>
              {artifactList.map((artifact) => {
                const isSelected = artifact.id === selectedArtifactId;
                const worker = workers.find((w) => w.id === artifact.createdByWorkerId);
                return (
                  <div
                    key={artifact.id}
                    className={`flex flex-col gap-0.5 px-2 py-1.5 mt-1 text-xs cursor-pointer rounded transition-colors ${
                      isSelected ? 'bg-cyber-accent/15 text-cyber-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => {
                      setSelectedArtifactId(isSelected ? null : artifact.id);
                      setSelectedFile(null);
                    }}
                  >
                    <span className="truncate font-medium">{artifact.title}</span>
                    <span className="text-[10px] text-gray-600 truncate">{artifact.path}</span>
                    {worker && <span className="text-[10px] text-gray-500">{worker.name}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview column */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {selectedArtifact ? (
            <div className="cyber-panel p-4">
              <h3 className="text-sm font-medium text-white">{selectedArtifact.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{selectedArtifact.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="text-xs text-gray-500">来源：Commander 产物</span>
                <span className="text-xs text-cyber">关联任务：{selectedArtifact.taskId}</span>
              </div>
              {selectedArtifact.createdByWorkerId && (
                <span className="text-xs text-gray-500">
                  创作者：{workers.find((w) => w.id === selectedArtifact.createdByWorkerId)?.name ?? selectedArtifact.createdByWorkerId}
                </span>
              )}
              <div className="mt-3">
                <p className="text-[10px] text-gray-600 font-mono">{selectedArtifact.path}</p>
              </div>
            </div>
          ) : (
            <>
              <FilePreview file={selectedFile} />

              {selectedFile && (
                <div className="mt-3 space-y-1">
                  {selectedFile.sourceTaskId && (
                    <button
                      className="cyber-btn text-xs w-full text-left"
                      onClick={() => selectTask(selectedFile.sourceTaskId!)}
                    >
                      任务：{getTask(selectedFile.sourceTaskId)?.title || selectedFile.sourceTaskId}
                    </button>
                  )}
                  {selectedFile.sourceAgentId && (
                    <button
                      className="cyber-btn text-xs w-full text-left"
                      onClick={() => selectAgent(selectedFile.sourceAgentId!)}
                    >
                      Agent：{selectedFile.sourceAgentId}
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                    <span>{selectedFile.size}</span>
                    <span>{new Date(selectedFile.updatedAt).toLocaleDateString('zh-CN')}</span>
                    <SourceBadge source={selectedFile.source} />
                  </div>
                </div>
              )}

              {!selectedFile && !selectedArtifactId && (
                <div className="text-gray-600 text-sm text-center py-12">
                  选择左侧文件或 Commander 产物查看详情
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
