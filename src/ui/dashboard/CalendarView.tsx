import { useMemo, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { dispatch, createEvent } from '@/core/event-bus';
import { getWeekColumns, shiftWeekStart } from './workbenchTesting';
import { WorkbenchHeader } from './WorkbenchHeader';

const TYPE_COLORS: Record<string, string> = {
  meeting: '#b347ea',
  task: '#00f0ff',
  plan: '#00e676',
  review: '#f0a500',
  cron: '#ffb84d',
};

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function CalendarView() {
  const getTask = useOfficeStore((s) => s.getTask);
  const getAgent = useOfficeStore((s) => s.getAgent);
  const selectTask = useUIStore((s) => s.selectTask);
  const selectAgent = useUIStore((s) => s.selectAgent);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const items = useDashboardStore((s) => s.calendarItems);
  const weekStart = useDashboardStore((s) => s.calendarWeekStart);
  const setWeekStart = useDashboardStore((s) => s.setCalendarWeekStart);
  const toggleStage = useDashboardStore((s) => s.toggleStage);
  const markComplete = useDashboardStore((s) => s.markComplete);

  const columns = useMemo(() => getWeekColumns(items, weekStart), [items, weekStart]);
  const planItems = useMemo(() => items.filter((i) => i.type === 'plan' || (i.stages && i.stages.length > 0)), [items]);
  const today = new Date().toISOString().slice(0, 10);

  function handleComplete(itemId: string, taskId: string | null, title: string) {
    markComplete(itemId);
    dispatch(
      createEvent('user.action', taskId || null, null, {
        action: 'complete',
        itemId,
        title,
      }),
    );
  }

  function handleStage(itemId: string, taskId: string | null, title: string, stageIdx: number, stageLabel: string) {
    toggleStage(itemId, stageIdx);
    const updated = useDashboardStore.getState().calendarItems.find((i) => i.id === itemId);
    dispatch(
      createEvent('user.action', taskId || null, null, {
        action: 'stage_toggle',
        itemId,
        title,
        stage: stageLabel,
        progress: updated?.progress ?? 0,
      }),
    );
  }

  const weekLabel = `${weekStart} — ${shiftWeekStart(weekStart, 1)}`;

  return (
    <div className="workbench-page">
      <WorkbenchHeader
        title="日程 / 计划"
        subtitle={weekLabel}
        actions={
          <div className="flex gap-1">
            <button className="cyber-btn text-xs" onClick={() => setWeekStart(shiftWeekStart(weekStart, -1))}>
              上一周
            </button>
            <button className="cyber-btn text-xs" onClick={() => setWeekStart(shiftWeekStart(weekStart, 1))}>
              下一周
            </button>
          </div>
        }
      />

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {columns.map((col, ci) => {
          const isToday = col.date === today;
          return (
            <div key={col.date} className="min-w-0">
              <div className={`text-xs font-medium mb-2 text-center py-1 rounded ${isToday ? 'text-cyber-accent border border-cyber-accent/50 bg-cyber-accent/10' : 'text-gray-500'}`}>
                {WEEKDAY_LABELS[ci]}
                <br />
                <span className="text-[10px]">
                  {col.date.slice(5)}
                  {isToday && <span className="ml-1 text-cyber-accent">今天</span>}
                </span>
              </div>
              <div className="space-y-1.5">
                {col.items.map((item) => {
                  const task = item.taskId ? getTask(item.taskId) : undefined;
                  return (
                    <div
                      key={item.id}
                      className={`rounded border px-2 py-1.5 text-[11px] cursor-pointer transition-colors ${
                        item.completed
                          ? 'border-gray-700 bg-gray-900/30 opacity-60'
                          : 'border-cyber-border bg-cyber-panel hover:border-cyber-accent/40'
                      }`}
                      onClick={() => {
                        if (task?.assignedAgentId) selectAgent(task.assignedAgentId);
                        else if (item.agentId) selectAgent(item.agentId);
                        else if (item.taskId) selectTask(item.taskId);
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: TYPE_COLORS[item.type] || '#666' }}
                        />
                        <span className={`truncate ${item.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{item.time}</div>
                      {item.taskId && (
                        <button
                          className="cyber-btn text-[10px] mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModule('tasks');
                            selectTask(item.taskId!);
                          }}
                        >
                          关联任务
                        </button>
                      )}
                    </div>
                  );
                })}
                {col.items.length === 0 && (
                  <div className="text-[10px] text-gray-700 text-center py-2">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Learning plan panel */}
      {planItems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-cyber-accent mb-3">学习计划 & 阶段任务</h3>
          <div className="space-y-3">
            {planItems.map((item) => {
              const hasStages = item.stages && item.stages.length > 0;
              const stages = item.stages ?? [];
              const doneCount = stages.filter((s) => s.done).length;

              return (
                <div
                  key={item.id}
                  className={`cyber-panel p-3 ${item.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-1.5 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[item.type] || '#666' }}
                    />
                    <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-gray-500">{item.date} {item.time}</span>
                  </div>

                  {item.progress !== undefined && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500">计划进度</span>
                        <span className="text-[10px] text-gray-400">{Math.round(item.progress * 100)}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-cyber-dark overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.progress * 100}%`,
                            backgroundColor: item.completed ? '#00e676' : TYPE_COLORS[item.type],
                          }}
                        />
                      </div>
                      {hasStages && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-500">实际完成</span>
                          <span className="text-[10px] text-gray-400">{doneCount}/{stages.length}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {hasStages && (
                    <div className="space-y-1">
                      {stages.map((stage, si) => (
                        <div
                          key={si}
                          className="flex items-center gap-2 text-xs cursor-pointer hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStage(item.id, item.taskId, item.title, si, stage.label);
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 text-[10px]"
                            style={{
                              borderColor: stage.done ? '#00e676' : '#444466',
                              backgroundColor: stage.done ? '#00e67622' : 'transparent',
                              color: stage.done ? '#00e676' : 'transparent',
                            }}
                          >
                            {stage.done ? '✓' : ''}
                          </span>
                          <span className={stage.done ? 'text-gray-500 line-through' : 'text-gray-400'}>
                            {stage.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!item.completed && (item.progress !== undefined || hasStages) && (
                    <button
                      className="mt-2 cyber-btn text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(item.id, item.taskId, item.title);
                      }}
                    >
                      标记完成
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-gray-600 text-sm text-center py-12">暂无日程项目</div>
      )}
    </div>
  );
}
