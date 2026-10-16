import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Activity, ActivityCategory } from '../../types';

interface Props {
  activities: Activity[];
  onOpenNewActivity: (category?: any, initialDate?: string) => void;
  onSelectActivity: (activity: Activity) => void;
}

export const CalendarView: React.FC<Props> = ({
  activities,
  onOpenNewActivity,
  onSelectActivity,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredActivities =
    filterCategory === 'all'
      ? activities
      : activities.filter((a) => a.category === filterCategory);

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(
    currentDate
  );

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Adjust so Monday is 0
  const startDayOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getCategoryColor = (cat: ActivityCategory) => {
    switch (cat) {
      case 'iacc_team':
        return '#EF4444';
      case 'institute_gym':
        return '#FF6B2C';
      case 'home_physical':
        return '#3B82F6';
      case 'home_individual':
        return '#B7F56A';
      case 'match':
        return '#F59E0B';
      case 'recovery':
        return '#10B981';
      case 'rest':
        return '#8B5CF6';
      default:
        return '#EC4899';
    }
  };

  // Get activities for specific date YYYY-MM-DD
  const getActivitiesForDate = (dateStr: string) => {
    return filteredActivities.filter((a) => a.date === dateStr);
  };

  // Today ISO string
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#15191F] border border-[#222A36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-white capitalize tracking-wide">
              {monthName}
            </h1>
            <p className="text-xs text-[#9299A5]">Calendario deportivo y planificación personal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation Month */}
          <div className="flex items-center bg-[#0B0D10] border border-[#222A36] rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-[#9299A5] hover:text-white hover:bg-[#1A202A] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold text-white hover:text-[#FF6B2C] transition"
            >
              Hoy
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-[#9299A5] hover:text-white hover:bg-[#1A202A] transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0B0D10] border border-[#222A36] rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'month'
                  ? 'bg-[#1F2633] text-white font-bold'
                  : 'text-[#9299A5] hover:text-white'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'agenda'
                  ? 'bg-[#1F2633] text-white font-bold'
                  : 'text-[#9299A5] hover:text-white'
              }`}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={() => onOpenNewActivity()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Planificar</span>
          </button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] overflow-x-auto">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono-num font-bold text-[#6D7787] uppercase pb-3 border-b border-[#202734] min-w-[600px]">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 pt-3 min-w-[600px]">
            {/* Empty slots before first day */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-28 rounded-2xl bg-[#0B0D10]/30 border border-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const dayActivities = getActivitiesForDate(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => onOpenNewActivity(undefined, dateStr)}
                  className={`h-28 p-2 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                    isToday
                      ? 'bg-[#FF6B2C]/5 border-[#FF6B2C]/50 shadow-inner'
                      : 'bg-[#0B0D10] border-[#1C232E] hover:border-[#2F394A] hover:bg-[#12161D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono-num font-bold ${
                        isToday
                          ? 'bg-[#FF6B2C] text-black'
                          : 'text-white group-hover:text-[#FF6B2C]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayActivities.length > 0 && (
                      <span className="text-[10px] font-mono-num text-[#6D7787]">
                        {dayActivities.length} {dayActivities.length === 1 ? 'act' : 'acts'}
                      </span>
                    )}
                  </div>

                  {/* Activity pills inside day */}
                  <div className="space-y-1 overflow-y-auto max-h-16 scrollbar-none">
                    {dayActivities.slice(0, 2).map((act) => (
                      <div
                        key={act.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectActivity(act);
                        }}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white truncate transition hover:brightness-120"
                        style={{
                          backgroundColor: `${getCategoryColor(act.category)}25`,
                          borderLeft: `3px solid ${getCategoryColor(act.category)}`,
                        }}
                      >
                        <span className="truncate">
                          {act.category === 'iacc_team'
                            ? act.iaccCategoryLevel === 'U21'
                              ? '⚡ U21'
                              : '🏀 U17'
                            : act.category === 'institute_gym'
                            ? 'Gym'
                            : act.category === 'home_individual'
                            ? 'Tiro'
                            : act.category === 'home_physical'
                            ? 'Físico'
                            : act.category}
                        </span>
                      </div>
                    ))}
                    {dayActivities.length > 2 && (
                      <div className="text-[9px] text-[#FF6B2C] font-mono-num pl-1">
                        +{dayActivities.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
          <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
            Lista Cronológica de Actividades
          </h3>

          {filteredActivities.length > 0 ? (
            <div className="space-y-3">
              {[...filteredActivities]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((act) => (
                  <div
                    key={act.id}
                    onClick={() => onSelectActivity(act)}
                    className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] hover:border-[#2F394A] transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(act.category) }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-[#FF6B2C] transition-colors">
                            {act.category === 'iacc_team'
                              ? act.iaccCategoryLevel === 'U21'
                                ? 'IACC EQUIPO — U21'
                                : 'IACC EQUIPO — U17'
                              : act.category.replace('_', ' ').toUpperCase()}
                          </span>
                          {act.category === 'iacc_team' && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                act.iaccCategoryLevel === 'U21'
                                  ? 'bg-[#FF6B2C]/20 text-[#FF6B2C]'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {act.iaccCategoryLevel === 'U21' ? '⚡ U21' : '🏀 U17'}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2633] text-[#9299A5]">
                            {act.date}
                          </span>
                          {act.status === 'planned' && (
                            <span className="text-[10px] font-bold text-[#FF6B2C] bg-[#FF6B2C]/10 px-1.5 py-0.5 rounded">
                              Planificada
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#6D7787] flex items-center gap-2 mt-0.5">
                          <span>{act.durationMinutes} min</span>
                          {act.startTime && <span>• {act.startTime} hs</span>}
                          {act.rpe !== undefined && <span>• RPE {act.rpe}/10</span>}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#6D7787] group-hover:text-white transition-colors" />
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#6D7787]">
              No hay actividades registradas en esta vista.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
