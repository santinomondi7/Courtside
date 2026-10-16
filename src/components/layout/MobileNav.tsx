import React, { useState } from 'react';
import {
  LayoutDashboard,
  Plus,
  Users,
  BarChart3,
  Menu,
  X,
  Dumbbell,
  Home,
  Target,
  CalendarDays,
  Trophy,
  History,
  Settings,
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface Props {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const MobileNav: React.FC<Props> = ({ activeSection, onSelectSection }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelect = (sec: NavSection) => {
    onSelectSection(sec);
    setDrawerOpen(false);
  };

  const moreItems = [
    { id: 'gym' as NavSection, label: 'Gimnasio Instituto', icon: Dumbbell, desc: 'Fuerza, cargas y volumen' },
    { id: 'home_physical' as NavSection, label: 'Físico en Casa', icon: Home, desc: 'Pliometría y estabilidad' },
    { id: 'basketball_skill' as NavSection, label: 'Técnica Individual', icon: Target, desc: 'Tiros en patio y manejo' },
    { id: 'calendar' as NavSection, label: 'Calendario', icon: CalendarDays, desc: 'Mes, semana y agenda' },
    { id: 'goals' as NavSection, label: 'Objetivos Deportivos', icon: Trophy, desc: 'Salto, velocidad y metas' },
    { id: 'history' as NavSection, label: 'Historial Completo', icon: History, desc: 'Filtros y exportación' },
    { id: 'settings' as NavSection, label: 'Configuración y Supabase', icon: Settings, desc: 'Perfil, club, sync y PWA' },
  ];

  return (
    <>
      {/* Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0B0D10]/95 backdrop-blur-lg border-t border-[#1C232E] px-2 flex items-center justify-around safe-area-bottom">
        <button
          onClick={() => handleSelect('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] transition ${
            activeSection === 'dashboard' ? 'text-[#FF6B2C] font-bold' : 'text-[#9299A5]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => handleSelect('iacc')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] transition ${
            activeSection === 'iacc' ? 'text-[#FF6B2C] font-bold' : 'text-[#9299A5]'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>IACC</span>
        </button>

        {/* Center Prominent Add Button */}
        <button
          onClick={() => handleSelect('logger')}
          className="relative -top-4 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF6B2C] to-[#FF8243] text-black shadow-lg shadow-[#FF6B2C]/40 border-2 border-[#0B0D10] active:scale-95 transition"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={() => handleSelect('stats')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] transition ${
            activeSection === 'stats' ? 'text-[#FF6B2C] font-bold' : 'text-[#9299A5]'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Stats</span>
        </button>

        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] transition ${
            drawerOpen || !['dashboard', 'iacc', 'logger', 'stats'].includes(activeSection)
              ? 'text-[#FF6B2C] font-bold'
              : 'text-[#9299A5]'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Más</span>
        </button>
      </nav>

      {/* Slide-over Drawer for 'Más' */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full bg-[#15191F] border-t border-[#252E3C] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#202734]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2C]" />
                <h3 className="font-display font-bold text-lg text-white">Módulos COURTSIDE</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-[#9299A5] hover:text-white bg-[#0B0D10]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/40 text-white'
                        : 'bg-[#0E1117] border-[#1E2530] text-[#9299A5] hover:bg-[#161D27] hover:text-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-[#FF6B2C] text-black' : 'bg-[#18202A] text-[#FF6B2C]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-[#9299A5] leading-tight mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
