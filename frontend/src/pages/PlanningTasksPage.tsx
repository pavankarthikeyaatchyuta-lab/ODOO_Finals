import React, { useState } from 'react';
import { WeddingTask, Wedding } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CheckSquare, Filter, User, Calendar, CheckCircle2, Crown, Sparkles } from 'lucide-react';

interface PlanningTasksPageProps {
  tasks: WeddingTask[];
  currentWedding: Wedding;
  onUpdateStage: (taskId: string, stage: WeddingTask['stage']) => void;
}

export const PlanningTasksPage: React.FC<PlanningTasksPageProps> = ({
  tasks,
  currentWedding,
  onUpdateStage
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter tasks based on selected category and package type
  const filteredTasks = tasks.filter(t => {
    if (currentWedding.packageType === 'day_of' && t.packageScope === 'FULL_SERVICE_ONLY') {
      return false;
    }
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const categories = ['ALL', 'VENUE', 'DESIGN', 'VENDORS', 'MEHENDI', 'SANGEET', 'PHERAS', 'RECEPTION', 'CLEANUP'];

  const stages: Array<{ key: WeddingTask['stage']; label: string; color: string }> = [
    { key: 'TO_PLAN', label: 'To Plan', color: 'border-slate-300' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-400' },
    { key: 'REVIEW', label: 'Under Review', color: 'border-amber-400' },
    { key: 'DONE', label: 'Completed', color: 'border-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Instant Wedding Plan (25+ Auto-Generated Tasks)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scenario 3: Automatically seeded on proposal confirmation and booking deposit. Covers Venue, Design, Vendors, Mehendi, Sangeet, Pheras, and Reception with assigned owners and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            label={`${filteredTasks.length} Tasks Generated (${currentWedding.packageType.replace('_', ' ')})`}
            variant="success"
            size="sm"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          Filter:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#1B3B6F] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4-Stage Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map(stage => {
          const stageTasks = filteredTasks.filter(t => t.stage === stage.key);

          return (
            <div
              key={stage.key}
              className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 flex flex-col h-[700px]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                <span className="font-serif font-bold text-sm text-[#0D1B2A]">
                  {stage.label}
                </span>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                  {stageTasks.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {stageTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {task.category}
                      </span>
                      {task.isKeyMilestone && (
                        <span className="text-[10px] font-bold text-[#C5A059] flex items-center gap-0.5">
                          <Crown className="w-3 h-3" /> VIP
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs text-[#0D1B2A] leading-snug">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#1B3B6F]" />
                        {task.owner}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {task.dueDate}
                      </span>
                    </div>

                    {/* Quick Stage Mover */}
                    <div className="pt-2 flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-slate-400">Move:</span>
                      <div className="flex items-center gap-1">
                        {stages.map(s => (
                          <button
                            key={s.key}
                            disabled={task.stage === s.key}
                            onClick={() => onUpdateStage(task.id, s.key)}
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
