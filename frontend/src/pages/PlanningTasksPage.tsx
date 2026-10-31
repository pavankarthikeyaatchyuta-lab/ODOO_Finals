import React, { useState, useMemo } from 'react';
import { WeddingTask, Wedding } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import {
  CheckSquare,
  Filter,
  User,
  Calendar,
  CheckCircle2,
  Crown,
  Sparkles,
  AlertTriangle,
  Clock,
  Plus,
  LayoutGrid,
  List,
  CalendarDays,
  Search,
  Eye,
  ArrowRight,
  ShieldAlert,
  Edit2
} from 'lucide-react';

interface PlanningTasksPageProps {
  tasks: WeddingTask[];
  currentWedding: Wedding;
  onUpdateStage: (taskId: string, stage: WeddingTask['stage'], blockedReason?: string) => void;
  onUpdateTask?: (task: WeddingTask) => void;
  onCreateTask?: (task: Omit<WeddingTask, 'id'>) => void;
}

type ViewMode = 'board' | 'list' | 'calendar';

export const PlanningTasksPage: React.FC<PlanningTasksPageProps> = ({
  tasks,
  currentWedding,
  onUpdateStage,
  onUpdateTask,
  onCreateTask
}) => {
  // View Toggle State: board | list | calendar
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('ALL');
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedDeadline, setSelectedDeadline] = useState<string>('ALL');

  // Modals
  const [selectedTask, setSelectedTask] = useState<WeddingTask | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [blockedInput, setBlockedInput] = useState('');

  // Form State for New Task
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<WeddingTask['category']>('VENUE');
  const [newFunction, setNewFunction] = useState<NonNullable<WeddingTask['functionName']>>('OVERALL');
  const [newOwner, setNewOwner] = useState('Priya Mehra');
  const [newDueDate, setNewDueDate] = useState('2026-12-15');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'NORMAL'>('MEDIUM');
  const [newIsMilestone, setNewIsMilestone] = useState(false);

  // Filter tasks based on package scope, function, owner, stage, deadline, search
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Package Differentiation Rule: Day-Of weddings exclude full-service-only tasks
      if (currentWedding.packageType === 'day_of' && t.packageScope === 'FULL_SERVICE_ONLY') {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesOwner = t.owner.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesOwner) return false;
      }

      // Function filter
      if (selectedFunction !== 'ALL') {
        if (t.functionName !== selectedFunction && t.category !== selectedFunction) {
          return false;
        }
      }

      // Owner filter
      if (selectedOwner !== 'ALL' && t.owner !== selectedOwner) {
        return false;
      }

      // Stage filter
      if (selectedStage !== 'ALL' && t.stage !== selectedStage) {
        return false;
      }

      // Deadline filter
      if (selectedDeadline !== 'ALL') {
        const due = new Date(t.dueDate).getTime();
        const now = new Date('2026-10-31').getTime();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (selectedDeadline === 'OVERDUE' && diffDays < 0 && t.stage !== 'DONE') {
          return true;
        } else if (selectedDeadline === 'NEXT_7_DAYS' && diffDays >= 0 && diffDays <= 7) {
          return true;
        } else if (selectedDeadline === 'NEXT_30_DAYS' && diffDays >= 0 && diffDays <= 30) {
          return true;
        } else if (selectedDeadline === 'FUTURE' && diffDays > 30) {
          return true;
        }
        return false;
      }

      return true;
    });
  }, [tasks, currentWedding.packageType, searchQuery, selectedFunction, selectedOwner, selectedStage, selectedDeadline]);

  // Status Columns for Board
  const stages: Array<{ key: WeddingTask['stage']; label: string; headerColor: string; badgeVariant: 'warning' | 'info' | 'success' | 'danger' }> = [
    { key: 'TO_PLAN', label: 'To Plan', headerColor: 'bg-slate-100 text-slate-800', badgeVariant: 'warning' },
    { key: 'IN_PROGRESS', label: 'In Progress', headerColor: 'bg-blue-100 text-blue-900', badgeVariant: 'info' },
    { key: 'DONE', label: 'Done', headerColor: 'bg-emerald-100 text-emerald-900', badgeVariant: 'success' },
    { key: 'BLOCKED', label: 'Blocked', headerColor: 'bg-rose-100 text-rose-900', badgeVariant: 'danger' }
  ];

  // Distinct Owners
  const ownersList = Array.from(new Set(tasks.map(t => t.owner)));

  // Handlers
  const handleStageChange = (taskId: string, nextStage: WeddingTask['stage'], reason?: string) => {
    onUpdateStage(taskId, nextStage, reason);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, stage: nextStage, blockedReason: reason } : null);
    }
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newTask: Omit<WeddingTask, 'id'> = {
      weddingId: currentWedding.id,
      title: newTitle,
      description: newDescription || undefined,
      category: newCategory,
      functionName: newFunction,
      owner: newOwner,
      dueDate: newDueDate,
      stage: 'TO_PLAN',
      isKeyMilestone: newIsMilestone,
      packageScope: 'ALL',
      priority: newPriority
    };

    if (onCreateTask) {
      onCreateTask(newTask);
    }

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  // Table Column Definitions for List View
  const listColumns: ColumnDef<WeddingTask>[] = [
    {
      id: 'title',
      header: 'Task Title & Description',
      accessorKey: 'title',
      sortable: true,
      cell: (t) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-[#0D1B2A]">{t.title}</span>
            {t.isKeyMilestone && (
              <span className="text-[10px] bg-[#C5A059]/15 text-[#0D1B2A] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5 fill-[#C5A059] text-[#C5A059]" /> VIP
              </span>
            )}
          </div>
          {t.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
          )}
        </div>
      )
    },
    {
      id: 'function',
      header: 'Function / Zone',
      accessorKey: 'functionName',
      sortable: true,
      cell: (t) => (
        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">
          {t.functionName || t.category}
        </span>
      )
    },
    {
      id: 'owner',
      header: 'Assignee',
      accessorKey: 'owner',
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <User className="w-3.5 h-3.5 text-[#1B3B6F]" />
          <span>{t.owner}</span>
        </div>
      )
    },
    {
      id: 'dueDate',
      header: 'Deadline',
      accessorKey: 'dueDate',
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.dueDate}</span>
        </div>
      )
    },
    {
      id: 'stage',
      header: 'Status',
      accessorKey: 'stage',
      sortable: true,
      cell: (t) => (
        <StatusBadge
          label={t.stage.replace('_', ' ')}
          variant={t.stage === 'DONE' ? 'success' : t.stage === 'IN_PROGRESS' ? 'info' : t.stage === 'BLOCKED' ? 'danger' : 'warning'}
          size="sm"
        />
      )
    },
    {
      id: 'actions',
      header: 'Action',
      align: 'right',
      cell: (t) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTask(t);
            setBlockedInput(t.blockedReason || '');
          }}
        >
          Details
        </Button>
      )
    }
  ];

  // Calendar Timeline Grouping
  const timelineMilestones = [
    {
      label: 'Phase 1: Venue Procurement & Approvals (T-90 to T-60 Days)',
      subtitle: 'August – September 2026',
      tasks: filteredTasks.filter(t => ['task-01', 'task-02', 'task-03', 'task-07', 'task-08'].includes(t.id))
    },
    {
      label: 'Phase 2: Architectural Design & Creative Production (T-60 to T-30 Days)',
      subtitle: 'October – November 2026',
      tasks: filteredTasks.filter(t => ['task-04', 'task-05', 'task-06', 'task-09', 'task-10', 'task-11'].includes(t.id))
    },
    {
      label: 'Phase 3: Function Staging & Pre-Event Rehearsals (T-14 to T-1 Days)',
      subtitle: 'Early December 2026',
      tasks: filteredTasks.filter(t => ['task-12', 'task-13', 'task-14', 'task-15', 'task-16', 'task-17'].includes(t.id))
    },
    {
      label: 'Phase 4: Live 3-Day Wedding Operations (Day 1 to Day 3)',
      subtitle: '22 – 24 December 2026',
      tasks: filteredTasks.filter(t => ['task-18', 'task-19', 'task-20', 'task-21', 'task-22', 'task-23', 'task-24'].includes(t.id))
    },
    {
      label: 'Phase 5: Heritage Site Handover & Settlement (Post-Event)',
      subtitle: '25 – 26 December 2026',
      tasks: filteredTasks.filter(t => ['task-25', 'task-26'].includes(t.id))
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Task Management & Milestone Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.3 & Scenario 3: Real-time wedding planning task suite for {currentWedding.coupleNames}. Differentiates Full-Service ({tasks.length} tasks) vs Day-Of coordination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'board'
                  ? 'bg-white text-[#0D1B2A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#0D1B2A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#0D1B2A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Multi-Facet Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        {/* Search & Main Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or assignees..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          {/* Function Filter */}
          <div className="w-44">
            <select
              value={selectedFunction}
              onChange={e => setSelectedFunction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
            >
              <option value="ALL">All Functions</option>
              <option value="OVERALL">Overall / General</option>
              <option value="MEHENDI">Mehendi</option>
              <option value="SANGEET">Sangeet</option>
              <option value="PHERAS">Varmala & Pheras</option>
              <option value="RECEPTION">Reception</option>
              <option value="CLEANUP">Cleanup & Handover</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div className="w-44">
            <select
              value={selectedOwner}
              onChange={e => setSelectedOwner(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
            >
              <option value="ALL">All Assignees</option>
              {ownersList.map(owner => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
            >
              <option value="ALL">All Statuses</option>
              <option value="TO_PLAN">To Plan</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Deadline Filter */}
          <div className="w-36">
            <select
              value={selectedDeadline}
              onChange={e => setSelectedDeadline(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]"
            >
              <option value="ALL">All Deadlines</option>
              <option value="OVERDUE">Overdue</option>
              <option value="NEXT_7_DAYS">Next 7 Days</option>
              <option value="NEXT_30_DAYS">Next 30 Days</option>
              <option value="FUTURE">Future</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedFunction !== 'ALL' || selectedOwner !== 'ALL' || selectedStage !== 'ALL' || selectedDeadline !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFunction('ALL');
                setSelectedOwner('ALL');
                setSelectedStage('ALL');
                setSelectedDeadline('ALL');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* Scope Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong>{filteredTasks.length}</strong> matching tasks for <strong>{currentWedding.packageType === 'full_service' ? 'Full-Service Package' : 'Partial / Day-Of Coordination'}</strong>
          </span>
          <span className="font-mono text-[11px] text-[#1B3B6F]">
            Event Code: {currentWedding.code}
          </span>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map(stage => {
            const stageTasks = filteredTasks.filter(t => t.stage === stage.key);

            return (
              <div
                key={stage.key}
                className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 flex flex-col h-[740px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-[#0D1B2A]">
                      {stage.label}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                      {stageTasks.length}
                    </span>
                  </div>
                  <StatusBadge label={stage.label} variant={stage.badgeVariant} size="sm" />
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {stageTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setBlockedInput(task.blockedReason || '');
                      }}
                      className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-2.5 ${
                        task.stage === 'BLOCKED'
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-200 hover:border-[#C5A059]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {task.functionName || task.category}
                        </span>
                        {task.isKeyMilestone && (
                          <span className="text-[10px] font-bold text-[#C5A059] flex items-center gap-0.5">
                            <Crown className="w-3 h-3 fill-[#C5A059]" /> VIP
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-xs text-[#0D1B2A] leading-snug">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Blocked Justification Notice */}
                      {task.stage === 'BLOCKED' && task.blockedReason && (
                        <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg text-[10px] text-rose-800 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span><strong>Blocked:</strong> {task.blockedReason}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#1B3B6F]" />
                          {task.owner.split(' ')[0]}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {task.dueDate}
                        </span>
                      </div>

                      {/* Quick Move Buttons */}
                      <div className="pt-2 flex items-center justify-between gap-1 text-[10px]">
                        <span className="text-slate-400 text-[10px]">Move:</span>
                        <div className="flex items-center gap-1">
                          {stages.map(s => (
                            <button
                              key={s.key}
                              disabled={task.stage === s.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (s.key === 'BLOCKED') {
                                  setSelectedTask(task);
                                  setBlockedInput(task.blockedReason || '');
                                } else {
                                  handleStageChange(task.id, s.key);
                                }
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                task.stage === s.key
                                  ? 'bg-slate-200 text-slate-500 cursor-default'
                                  : 'bg-slate-100 hover:bg-[#1B3B6F] hover:text-white text-slate-700'
                              }`}
                            >
                              {s.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageTasks.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No tasks in this stage.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TABULAR LIST */}
      {viewMode === 'list' && (
        <DataTable
          data={filteredTasks}
          columns={listColumns}
          keyExtractor={(t) => t.id}
          onRowClick={(t) => {
            setSelectedTask(t);
            setBlockedInput(t.blockedReason || '');
          }}
          pageSize={10}
        />
      )}

      {/* VIEW 3: CALENDAR / MILESTONE TIMELINE */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          {timelineMilestones.map((phase, pIdx) => (
            <div key={pIdx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">{phase.label}</h4>
                  <span className="text-xs text-slate-400 font-medium">{phase.subtitle}</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {phase.tasks.length} Milestone Tasks
                </span>
              </div>

              {phase.tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phase.tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setBlockedInput(task.blockedReason || '');
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#C5A059] cursor-pointer transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[#C5A059]">
                          {task.functionName || task.category}
                        </span>
                        <StatusBadge
                          label={task.stage.replace('_', ' ')}
                          variant={task.stage === 'DONE' ? 'success' : task.stage === 'IN_PROGRESS' ? 'info' : task.stage === 'BLOCKED' ? 'danger' : 'warning'}
                          size="sm"
                        />
                      </div>
                      <h5 className="font-semibold text-slate-800 line-clamp-2">{task.title}</h5>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-mono">
                        <span>Due: {task.dueDate}</span>
                        <span>{task.owner.split(' ')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No tasks matched in this milestone period.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Task Details & Stage Updater */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Task Dossier: ${selectedTask.title}`}
          subtitle={`Task ID: ${selectedTask.id} • Function: ${selectedTask.functionName || selectedTask.category}`}
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400 font-mono">
                Scope: {selectedTask.packageScope}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Description */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">Task Description & Deliverables:</span>
              <p className="text-slate-600 leading-relaxed">
                {selectedTask.description || 'No detailed briefing provided. Follow standard luxury operations protocols.'}
              </p>
            </div>

            {/* Task Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Assignee:</span>
                <span className="font-bold text-slate-800">{selectedTask.owner}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Deadline:</span>
                <span className="font-mono font-bold text-slate-800">{selectedTask.dueDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">VIP Milestone:</span>
                <span className="font-bold text-[#C5A059]">{selectedTask.isKeyMilestone ? 'Yes (Critical)' : 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Priority:</span>
                <span className="font-bold text-slate-800">{selectedTask.priority || 'MEDIUM'}</span>
              </div>
            </div>

            {/* Status Selector & State Transition */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                Update Task Status:
              </span>

              <div className="grid grid-cols-4 gap-2">
                {stages.map(s => (
                  <button
                    key={s.key}
                    onClick={() => {
                      if (s.key !== 'BLOCKED') {
                        handleStageChange(selectedTask.id, s.key);
                      } else {
                        handleStageChange(selectedTask.id, s.key, blockedInput || 'Awaiting municipal or vendor clearance');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                      selectedTask.stage === s.key
                        ? 'bg-[#1B3B6F] text-white border-transparent shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Blocked Reason Input Field */}
              {selectedTask.stage === 'BLOCKED' && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <FormField label="Blocked Justification (Reason & Blocked Dependency)" required>
                    <Input
                      value={blockedInput}
                      onChange={e => setBlockedInput(e.target.value)}
                      placeholder="e.g. Awaiting lake boat patrol night clearance letter..."
                    />
                  </FormField>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleStageChange(selectedTask.id, 'BLOCKED', blockedInput)}
                  >
                    Save Blocked Reason
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Add New Task */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Planning Task"
        subtitle={`Schedule task for ${currentWedding.coupleNames}`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreateTaskSubmit}>
              Save & Schedule Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5">
          <FormField label="Task Title" required>
            <Input
              placeholder="e.g. Confirm fireworks display license with local SP office"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Description & Notes">
            <Input
              placeholder="e.g. Review safety distance and cold-pyro placement on lotus stage..."
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Function Association">
              <Select
                value={newFunction}
                onChange={e => setNewFunction(e.target.value as any)}
                options={[
                  { value: 'OVERALL', label: 'Overall / General' },
                  { value: 'MEHENDI', label: 'Mehendi & High Tea' },
                  { value: 'SANGEET', label: 'Sangeet & Sufi Night' },
                  { value: 'PHERAS', label: 'Varmala & Pheras' },
                  { value: 'RECEPTION', label: 'Royal Banquet Reception' }
                ]}
              />
            </FormField>

            <FormField label="Category">
              <Select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                options={[
                  { value: 'VENUE', label: 'Venue & Permissions' },
                  { value: 'DESIGN', label: 'Design & Decor' },
                  { value: 'VENDORS', label: 'Vendors & Logistics' },
                  { value: 'MEHENDI', label: 'Mehendi' },
                  { value: 'SANGEET', label: 'Sangeet' },
                  { value: 'PHERAS', label: 'Pheras Ceremony' },
                  { value: 'RECEPTION', label: 'Reception' },
                  { value: 'CLEANUP', label: 'Cleanup & Handover' }
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Assignee / Owner" required>
              <Select
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                options={[
                  { value: 'Priya Mehra', label: 'Priya Mehra (Lead Luxury Director)' },
                  { value: 'Devendra Kaviraj', label: 'Devendra Kaviraj (Senior Planner)' },
                  { value: 'Siddharth Jain', label: 'Siddharth Jain (Vendor Operations)' },
                  { value: 'Anita Roy', label: 'Anita Roy (Hospitality)' },
                  { value: 'Amit Sharma', label: 'Amit Sharma (Safety & Mandap)' },
                  { value: 'Rohan Verma', label: 'Rohan Verma (Stage & Audio)' }
                ]}
              />
            </FormField>

            <FormField label="Deadline Date" required>
              <Input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Priority Level">
              <Select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as any)}
                options={[
                  { value: 'HIGH', label: 'High Priority' },
                  { value: 'MEDIUM', label: 'Medium Priority' },
                  { value: 'NORMAL', label: 'Normal Priority' }
                ]}
              />
            </FormField>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isMilestoneCheckbox"
                checked={newIsMilestone}
                onChange={e => setNewIsMilestone(e.target.checked)}
                className="w-4 h-4 text-[#C5A059] rounded border-slate-300 focus:ring-[#C5A059]"
              />
              <label htmlFor="isMilestoneCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Key VIP Milestone Task
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
