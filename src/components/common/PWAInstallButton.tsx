import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  variant?: 'header' | 'button' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already running inside installed standalone PWA, render subtle confirmation or hide
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 text-xs text-[#B7F56A] bg-[#B7F56A]/10 border border-[#B7F56A]/30 px-3 py-2 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>Aplicación instalada como PWA (Modo Autónomo)</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 3000);
    }
  };

  // Chromium / Desktop / Android prompt
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          onClick={handleInstallClick}
          title="Instalar COURTSIDE en tu dispositivo"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1F2633] hover:bg-[#2B3545] border border-[#354052] transition active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#FF6B2C]" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#FF6B2C] to-[#FF8243] hover:brightness-110 shadow-lg shadow-[#FF6B2C]/20 transition active:scale-95 ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Instalar COURTSIDE en este dispositivo</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'header' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            title="Instalar en iPhone / iPad"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1F2633] hover:bg-[#2B3545] border border-[#354052] transition ${className}`}
          >
            <Download className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span className="hidden sm:inline">Instalar iOS</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#1F2633] hover:bg-[#283242] border border-[#333F52] transition ${className}`}
          >
            <Share2 className="w-4 h-4 text-[#FF6B2C]" />
            <span>Instalar en iPhone (Safari)</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#15191F] border border-[#2B3545] p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#222A36]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FF6B2C] flex items-center justify-center font-bold text-black text-xs">
                    C
                  </div>
                  <h3 className="font-bold text-base">Instalar en iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-[#9299A5] hover:text-white p-1 rounded-lg hover:bg-[#222A36]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-[#9299A5]">
                <div className="flex items-start gap-3 bg-[#0B0D10] p-3 rounded-xl border border-[#1E2530]">
                  <div className="w-6 h-6 rounded-full bg-[#1F2633] text-[#FF6B2C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    En la barra inferior de <strong>Safari</strong>, tocá el botón{' '}
                    <span className="inline-flex items-center gap-1 text-white font-medium">
                      <Share2 className="w-3.5 h-3.5 text-[#FF6B2C]" /> Compartir
                    </span>.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#0B0D10] p-3 rounded-xl border border-[#1E2530]">
                  <div className="w-6 h-6 rounded-full bg-[#1F2633] text-[#FF6B2C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Deslizá hacia abajo y seleccioná{' '}
                    <span className="inline-flex items-center gap-1 text-white font-medium">
                      <PlusSquare className="w-3.5 h-3.5 text-[#FF6B2C]" /> Agregar a inicio
                    </span>.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#0B0D10] p-3 rounded-xl border border-[#1E2530]">
                  <div className="w-6 h-6 rounded-full bg-[#1F2633] text-[#B7F56A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Tocá <strong>Agregar</strong> en la esquina superior derecha. Se abrirá a pantalla completa sin la barra del navegador.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#FF6B2C] py-2.5 text-sm font-bold text-black hover:bg-[#FF8243] transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop browsers when prompt is already fired or standard Chrome menu
  if (variant === 'settings') {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0D10] border border-[#222A36]">
        <div>
          <div className="text-sm font-medium text-white">Instalación en PC (Chrome / Edge)</div>
          <div className="text-xs text-[#9299A5] mt-0.5">
            Hacé clic en el ícono de instalar en la barra de direcciones o Menú ⋮ → "Instalar COURTSIDE".
          </div>
        </div>
      </div>
    );
  }

  return null;
};
