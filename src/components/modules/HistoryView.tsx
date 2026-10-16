import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  ChevronRight,
  Trash2,
  Edit,
  ArrowUpDown,
} from 'lucide-react';
import { Activity, ActivityCategory, ActivityStatus } from '../../types';

interface Props {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onExportData: () => void;
}

export const HistoryView: React.FC<Props> = ({
  activities,
  onSelectActivity,
  onDeleteActivity,
  onExportData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter activities
  const filtered = activities.filter((act) => {
    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNotes = (act.notes || '').toLowerCase().includes(q);
      const matchDrill = (act.basketballDrillName || '').toLowerCase().includes(q);
      const matchHome = (act.homeSessionName || '').toLowerCase().includes(q);
      const matchGym = (act.gymGoal || '').toLowerCase().includes(q);
      const matchOpponent = (act.matchOpponent || '').toLowerCase().includes(q);
      const matchWell = (act.iaccWhatWentWell || '').toLowerCase().includes(q);
      if (!matchNotes && !matchDrill && !matchHome && !matchGym && !matchOpponent && !matchWell) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'iacc_u17') {
        if (act.category !== 'iacc_team' || act.iaccCategoryLevel === 'U21') return false;
      } else if (selectedCategory === 'iacc_u21') {
        if (act.category !== 'iacc_team' || act.iaccCategoryLevel !== 'U21') return false;
      } else if (act.category !== selectedCategory) {
        return false;
      }
    }

    // Status filter
    if (selectedStatus !== 'all' && act.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return sortOrder === 'desc' ? diff : -diff;
  });

  const exportToCSV = () => {
    if (activities.length === 0) return;

    const headers = ['ID', 'Fecha', 'Hora', 'Categoría', 'Estado', 'Duración (min)', 'RPE', 'Fatiga', 'Sueño (hs)', 'Notas'];
    const rows = activities.map((a) => [
      a.id,
      a.date,
      a.startTime || '',
      a.category,
      a.status,
      a.durationMinutes,
      a.rpe || '',
      a.fatigueLevel || '',
      a.sleepHours || '',
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `courtside_entrenamientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-white tracking-wide">
              HISTORIAL DE ENTRENAMIENTOS
            </h1>
            <p className="text-xs text-[#9299A5]">
              Consulta, filtrá y exportá todos tus registros deportivos organizados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#0B0D10] border border-[#26303E] hover:bg-[#19222E] transition"
            title="Descargar archivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#B7F56A]" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={onExportData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#0B0D10] border border-[#26303E] hover:bg-[#19222E] transition"
            title="Copia de seguridad completa JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>Backup JSON</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filters */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6D7787] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por notas, rival, ejercicio, sensaciones..."
              className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0B0D10] border border-[#252E3C] rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="all">Todas las categorías</option>
            <option value="iacc_team">Entrenamiento IACC (Todos)</option>
            <option value="iacc_u17">🏀 IACC U17 (Formativas)</option>
            <option value="iacc_u21">⚡ IACC U21 (Roce Superior)</option>
            <option value="institute_gym">Gimnasio Instituto</option>
            <option value="home_physical">Físico en Casa</option>
            <option value="home_individual">Técnica Individual</option>
            <option value="match">Partidos</option>
            <option value="recovery">Recuperación</option>
            <option value="rest">Descanso</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0B0D10] border border-[#252E3C] rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="partial">Parciales</option>
            <option value="planned">Planificadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#0B0D10] border border-[#252E3C] text-xs font-semibold text-white hover:bg-[#151D28] transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>{sortOrder === 'desc' ? 'Más recientes' : 'Más antiguas'}</span>
          </button>
        </div>

        <div className="flex justify-between text-xs text-[#6D7787] pt-1">
          <span>Mostrando {sorted.length} de {activities.length} sesiones registradas</span>
          {(selectedCategory !== 'all' || selectedStatus !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="text-[#FF6B2C] hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {sorted.length > 0 ? (
          sorted.map((act) => (
            <div
              key={act.id}
              onClick={() => onSelectActivity(act)}
              className="p-4 sm:p-5 rounded-3xl bg-[#15191F] border border-[#222A36] hover:border-[#2F394A] transition cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <span
                  className="w-3.5 h-3.5 rounded-full mt-1 sm:mt-0 shrink-0"
                  style={{ backgroundColor: getCategoryColor(act.category) }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white group-hover:text-[#FF6B2C] transition-colors">
                      {act.category === 'iacc_team'
                        ? act.iaccCategoryLevel === 'U21'
                          ? 'Entrenamiento IACC — U21'
                          : 'Entrenamiento IACC — U17'
                        : act.category === 'institute_gym'
                        ? act.gymGoal || 'Gimnasio Instituto'
                        : act.category === 'home_individual'
                        ? act.basketballDrillName || 'Técnica Individual'
                        : act.category === 'home_physical'
                        ? act.homeSessionName || 'Físico en Casa'
                        : act.category === 'match'
                        ? `Partido vs ${act.matchOpponent || 'Rival'}`
                        : act.category.replace('_', ' ')}
                    </span>
                    {act.category === 'iacc_team' && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          act.iaccCategoryLevel === 'U21'
                            ? 'bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {act.iaccCategoryLevel === 'U21' ? '⚡ Roce U21' : '🏀 U17'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B0D10] text-[#9299A5] border border-[#202734]">
                      {act.date}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        act.status === 'completed'
                          ? 'bg-[#B7F56A]/15 text-[#B7F56A]'
                          : act.status === 'planned'
                          ? 'bg-[#FF6B2C]/15 text-[#FF6B2C]'
                          : 'bg-[#1F2633] text-[#9299A5]'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#6D7787] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {act.durationMinutes > 0 && <span>Duración: {act.durationMinutes} min</span>}
                    {act.rpe !== undefined && act.rpe > 0 && <span>RPE: {act.rpe}/10</span>}
                    {act.fatigueLevel !== undefined && <span>Fatiga: {act.fatigueLevel}/10</span>}
                    {act.basketballAccuracyPercentage !== undefined && (
                      <span className="text-[#B7F56A] font-semibold">
                        Acierto: {act.basketballAccuracyPercentage}% ({act.basketballMakes}/{act.basketballAttempts})
                      </span>
                    )}
                  </div>

                  {act.notes && (
                    <p className="text-xs text-[#9299A5] mt-1.5 italic line-clamp-1">"{act.notes}"</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 self-end sm:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteActivity(act.id);
                  }}
                  className="p-2 rounded-xl text-[#6D7787] hover:text-red-400 hover:bg-[#0B0D10] transition"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-[#6D7787] group-hover:text-white transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-3xl bg-[#15191F] border border-[#222A36] text-[#6D7787] text-xs">
            No se encontraron actividades que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
};
