import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  RefreshCw,
  Copy,
  Check,
  X,
  ExternalLink,
  ArrowRightLeft,
  Cloud,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Database,
  Code2,
  KeyRound,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import QRCode from 'qrcode';
import { CloudSyncService, SupabaseConfig } from '../../services/cloudSync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPushSync: () => Promise<void>;
  onPullSync: (customCode?: string) => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  showToast: (msg: string, type?: any) => void;
}

export const DeviceSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPushSync,
  onPullSync,
  isSyncing,
  lastSyncedAt,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'supabase'>('direct');
  const [syncCode, setSyncCode] = useState<string>(CloudSyncService.getSyncCode());
  const [inputCode, setInputCode] = useState<string>(syncCode);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Supabase states
  const [supaConfig, setSupaConfig] = useState<SupabaseConfig>(CloudSyncService.getSupabaseConfig());
  const [supaUrl, setSupaUrl] = useState<string>('');
  const [supaKey, setSupaKey] = useState<string>('');
  const [supaEnabled, setSupaEnabled] = useState<boolean>(false);
  const [testingSupa, setTestingSupa] = useState<boolean>(false);
  const [supaTestResult, setSupaTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState<boolean>(false);

  const pairingUrl = CloudSyncService.getShareablePairingUrl();

  useEffect(() => {
    if (isOpen) {
      const current = CloudSyncService.getSyncCode();
      setSyncCode(current);
      setInputCode(current);

      const currentSupa = CloudSyncService.getSupabaseConfig();
      setSupaConfig(currentSupa);
      setSupaUrl(currentSupa.url);
      setSupaKey(currentSupa.key);
      setSupaEnabled(currentSupa.enabled);
      setSupaTestResult(null);

      const url = CloudSyncService.getShareablePairingUrl();
      QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((urlData) => setQrDataUrl(urlData))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, syncCode]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopiedLink(true);
    showToast('Link de sincronización copiado al portapapeles.', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    showToast(`Código ${syncCode} copiado.`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(CloudSyncService.getSupabaseSqlSchema());
    setCopiedSql(true);
    showToast('Script SQL copiado para Supabase SQL Editor.', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;

    CloudSyncService.setSyncCode(clean);
    setSyncCode(clean);
    showToast(`Código actualizado a ${clean}. Sincronizando...`, 'info');
    await onPullSync(clean);
  };

  const handleTestSupabase = async () => {
    if (!supaUrl.trim() || !supaKey.trim()) {
      showToast('Ingresá la URL y la Anon Key de Supabase para probar.', 'error');
      return;
    }
    setTestingSupa(true);
    setSupaTestResult(null);
    const result = await CloudSyncService.testSupabaseConnection(supaUrl, supaKey);
    setTestingSupa(false);
    setSupaTestResult(result);
    if (result.success) {
      showToast('¡Conexión verificada con Supabase exitosamente!', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    CloudSyncService.setSupabaseConfig(supaUrl, supaKey, supaEnabled);
    setSupaConfig({ url: supaUrl, key: supaKey, enabled: supaEnabled });
    showToast(
      supaEnabled
        ? 'Configuración de Supabase guardada y activada.'
        : 'Configuración guardada (sincronización nativa activa).',
      'success'
    );
    if (supaEnabled) {
      await onPushSync();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-[#15191F] border border-[#273140] p-6 shadow-2xl text-white my-auto max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202734]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl text-white tracking-wide">
                SINCRONIZACIÓN Y NUBE
              </h2>
              <p className="text-xs text-[#9299A5]">
                Conectá tu celular, compu o tu propia base de datos Supabase
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#202734] hover:bg-[#1E2633] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Pill */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530] text-xs">
          <div className="flex items-center gap-2">
            <Cloud className={`w-4 h-4 ${isSyncing ? 'text-[#FF6B2C] animate-spin' : 'text-[#B7F56A]'}`} />
            <div>
              <span className="font-bold text-white">
                {isSyncing
                  ? 'Sincronizando...'
                  : supaConfig.enabled
                  ? 'Nube Supabase + COURTSIDE Activa'
                  : 'Nube Directa COURTSIDE Activa'}
              </span>
              {lastSyncedAt && (
                <span className="text-[#6D7787] block text-[10px]">
                  Última sincronización: {lastSyncedAt}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPushSync()}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition disabled:opacity-50 text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sincronizar ahora</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0D10] border border-[#1E2530] rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('direct')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'direct'
                ? 'bg-[#1F2633] text-white shadow-sm border border-[#303B4C]'
                : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>Celular ↔ PC (QR / Código)</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'supabase'
                ? 'bg-[#1F2633] text-white shadow-sm border border-[#303B4C]'
                : 'text-[#9299A5] hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#3ECF8E]" />
            <span>Conectar Supabase</span>
            {supaConfig.enabled && (
              <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse"></span>
            )}
          </button>
        </div>

        {/* TAB 1: DIRECT CELULAR <-> PC VIA BUILT-IN SERVER */}
        {activeTab === 'direct' && (
          <div className="space-y-4">
            {/* Method 1: Scan QR with Phone */}
            <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <QrCode className="w-4 h-4 text-[#B7F56A]" />
                  <span>Opción 1: Escanear con la cámara del celular</span>
                </div>
                <span className="text-[10px] text-[#6D7787]">Emparejamiento instantáneo</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#15191F] p-4 rounded-xl border border-[#222A36]">
                {qrDataUrl ? (
                  <div className="p-2 bg-white rounded-xl shrink-0 shadow-lg">
                    <img src={qrDataUrl} alt="QR Sincronización" className="w-32 h-32 block" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-[#0B0D10] animate-pulse flex items-center justify-center text-xs text-[#6D7787]">
                    Generando QR...
                  </div>
                )}

                <div className="text-xs text-[#9299A5] space-y-2 text-center sm:text-left">
                  <p>
                    1. Abrí la cámara o lector de QR de tu celular.<br />
                    2. Apuntá a este código para abrir COURTSIDE ya vinculado.<br />
                    3. Los cambios que hagas en el celu o compu se sincronizan automáticamente.
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-[#1F2633] hover:bg-[#2A3445] border border-[#354052] transition"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-[#B7F56A]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? '¡Link copiado!' : 'Copiar link para WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Method 2: Sync Code */}
            <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Smartphone className="w-4 h-4 text-[#FF6B2C]" />
                  <span>Opción 2: Código de sincronización manual</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="text-[11px] font-mono-num text-[#FF6B2C] hover:underline flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-[#B7F56A]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar código'}</span>
                </button>
              </div>

              <form onSubmit={handleApplyCode} className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Ej. SANTINO-IACC"
                    className="flex-1 bg-[#15191F] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num font-bold tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl font-bold text-white bg-[#1F2633] hover:bg-[#2B3545] border border-[#354052] transition disabled:opacity-50"
                  >
                    Conectar
                  </button>
                </div>
                <p className="text-[11px] text-[#6D7787]">
                  Si ya tenés COURTSIDE en tu celular, escribí este mismo código en la compu para sincronizarlos al instante.
                </p>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE INTEGRATION */}
        {activeTab === 'supabase' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Database className="w-4 h-4 text-[#3ECF8E]" />
                  <span>Tu Base de Datos Supabase (PostgreSQL)</span>
                </div>
                <span className="text-[10px] text-[#3ECF8E] font-semibold bg-[#3ECF8E]/10 px-2 py-0.5 rounded-full border border-[#3ECF8E]/20">
                  Opcional / Pro
                </span>
              </div>

              <p className="text-xs text-[#9299A5] leading-relaxed">
                Si tenés un proyecto en <strong className="text-white">Supabase</strong>, podés almacenar tus entrenamientos, métricas y tiros en tu propia tabla en la nube de forma permanente.
              </p>

              <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-2 text-xs">
                {/* Supabase URL */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#3ECF8E]" />
                    <span>Project URL</span>
                  </label>
                  <input
                    type="url"
                    value={supaUrl}
                    onChange={(e) => setSupaUrl(e.target.value)}
                    placeholder="https://xyzabcdefg.supabase.co"
                    className="w-full bg-[#15191F] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num text-xs focus:border-[#3ECF8E] outline-none"
                  />
                  <span className="text-[10px] text-[#6D7787] block mt-0.5">
                    La encontrás en Supabase → Project Settings → API → Project URL
                  </span>
                </div>

                {/* Supabase Anon Key */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#3ECF8E]" />
                    <span>Anon / Public Key</span>
                  </label>
                  <input
                    type="password"
                    value={supaKey}
                    onChange={(e) => setSupaKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-[#15191F] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num text-xs focus:border-[#3ECF8E] outline-none"
                  />
                  <span className="text-[10px] text-[#6D7787] block mt-0.5">
                    La encontrás en Supabase → Project Settings → API → anon / public key
                  </span>
                </div>

                {/* Enable checkbox */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#15191F] border border-[#222A36]">
                  <input
                    type="checkbox"
                    id="enableSupa"
                    checked={supaEnabled}
                    onChange={(e) => setSupaEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3ECF8E] bg-[#0B0D10] border-[#303B4C] focus:ring-[#3ECF8E]"
                  />
                  <label htmlFor="enableSupa" className="text-xs font-semibold text-white cursor-pointer select-none">
                    Activar sincronización con Supabase para esta app
                  </label>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={testingSupa}
                    className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white bg-[#1F2633] hover:bg-[#2A3445] border border-[#323D4E] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingSupa ? 'animate-spin' : ''}`} />
                    <span>{testingSupa ? 'Probando...' : 'Probar Conexión'}</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-black bg-[#3ECF8E] hover:bg-[#4CE09E] transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>

                {/* Test feedback */}
                {supaTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                      supaTestResult.success
                        ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/30 text-[#3ECF8E]'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {supaTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{supaTestResult.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* SQL Guide Accordion */}
            <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Code2 className="w-4 h-4 text-[#FF6B2C]" />
                  <span>Script SQL para crear la tabla en Supabase</span>
                </div>
                <button
                  onClick={() => setShowSqlGuide(!showSqlGuide)}
                  className="text-[11px] text-[#FF6B2C] hover:underline"
                >
                  {showSqlGuide ? 'Ocultar' : 'Ver script'}
                </button>
              </div>

              {showSqlGuide && (
                <div className="space-y-2 pt-1 text-xs">
                  <p className="text-[#9299A5] text-[11px]">
                    Andá a tu panel en <strong className="text-white">Supabase → SQL Editor</strong>, creá una <em>New Query</em>, pegá este código y hacé clic en <strong>Run</strong>:
                  </p>
                  <pre className="p-3 rounded-xl bg-[#15191F] border border-[#232C3A] text-[10px] text-[#A6B2C2] overflow-x-auto font-mono">
                    {CloudSyncService.getSupabaseSqlSchema()}
                  </pre>
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-[#1F2633] hover:bg-[#2A3445] border border-[#354052] transition"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-[#B7F56A]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] text-xs transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
