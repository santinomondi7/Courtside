import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#15191F] border border-[#262F3D] p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-3 border-b border-[#222A36]">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDanger ? 'bg-red-500/10 text-red-400' : 'bg-[#FF6B2C]/10 text-[#FF6B2C]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[#9299A5] hover:text-white p-1 rounded-lg hover:bg-[#222A36]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-[#9299A5] leading-relaxed">{description}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#222A36] hover:bg-[#1A202A] transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                : 'bg-[#FF6B2C] hover:bg-[#FF8243] text-black shadow-lg shadow-[#FF6B2C]/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
