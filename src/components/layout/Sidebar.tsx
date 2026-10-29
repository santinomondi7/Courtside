import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Dumbbell,
  Home,
  Target,
  CalendarDays,
  BarChart3,
  Trophy,
  History,
  Settings,
  Sparkles,
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'analyst'
  | 'logger'
  | 'iacc'
  | 'gym'
  | 'home_physical'
  | 'basketball_skill'
  | 'calendar'
  | 'stats'
  | 'goals'
  | 'history'
  | 'settings';

interface Props {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  unreadRecommendationsCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeSection,
  onSelectSection,
  unreadRecommendationsCount = 0,
}) => {
  const mainNavItems = [
    { id: 'dashboard' as NavSection, label: 'Inicio', icon: LayoutDashboard },
    { id: 'analyst' as NavSection, label: 'Performance Analyst', icon: Sparkles, badge: 'IA' },
    { id: 'logger' as NavSection, label: 'Registrar actividad', icon: PlusCircle, isHighlight: true },
    { id: 'iacc' as NavSection, label: 'Entrenamientos IACC', icon: Users, badge: 'Club' },
    { id: 'gym' as NavSection, label: 'Gimnasio Instituto', icon: Dumbbell },
    { id: 'home_physical' as NavSection, label: 'Físico en Casa', icon: Home },
    { id: 'basketball_skill' as NavSection, label: 'Técnica Individual', icon: Target },
    { id: 'calendar' as NavSection, label: 'Calendario', icon: CalendarDays },
    { id: 'stats' as NavSection, label: 'Estadísticas & Carga', icon: BarChart3 },
    { id: 'goals' as NavSection, label: 'Objetivos & Evidencia', icon: Trophy },
    { id: 'history' as NavSection, label: 'Historial', icon: History },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 bg-[#0E1117] border-r border-[#1C232E] select-none p-3 justify-between">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono-num font-bold text-[#6D7787] uppercase tracking-wider">
          Centro de Rendimiento
        </div>

        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF6B2C]/15 to-transparent text-[#FF6B2C] border-l-3 border-[#FF6B2C]'
                  : 'text-[#9299A5] hover:text-white hover:bg-[#151921]'
              } ${item.isHighlight && !isActive ? 'text-[#FF8243]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#FF6B2C]' : item.isHighlight ? 'text-[#FF8243]' : 'text-[#9299A5]'
                  }`}
                />
                <span className={`text-xs ${isActive ? 'font-bold text-white' : ''}`}>
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom section: Settings & Coach Assistant Indicator */}
      <div className="pt-3 border-t border-[#1C232E] space-y-1">
        <button
          onClick={() => onSelectSection('settings')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
            activeSection === 'settings'
              ? 'bg-[#1F2633] text-[#FF6B2C] font-bold'
              : 'text-[#9299A5] hover:text-white hover:bg-[#151921]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </div>
          {unreadRecommendationsCount > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B2C] text-black">
              <Sparkles className="w-2.5 h-2.5" />
              {unreadRecommendationsCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
