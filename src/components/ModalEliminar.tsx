import React from 'react';
// Usamos iconos limpios de trazo fino
import { Trash2 } from 'lucide-react';

export interface ModalEliminarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: () => void;
  isDeleting?: boolean;
}

export const ModalEliminar: React.FC<ModalEliminarProps> = ({
  isOpen,
  onClose,
  onConfirmar,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    // Capa de fondo oscura translúcida (Backdrop)
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      
      {/* Contenedor del Modal */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 border"
        style={{
          backgroundColor: 'var(--theme-bg-card, #0a121d)',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
          color: 'var(--theme-text-main, #f8fafc)',
        }}
      >
        {/* Icono superior estilizado */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <Trash2 size={24} strokeWidth={1.5} />
        </div>

        {/* Textos Informativos */}
        <h3 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--theme-text-main, #f8fafc)' }}>
          ¿Mover a la Papelera de Reciclaje?
        </h3>
        <p className="mt-2 text-sm leading-relaxed px-2" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
          El elemento se resguardará cifrado en la Papelera con auto-vaciado definitivo tras <strong className="text-amber-500 font-semibold">30 días</strong>. Podrás restaurarlo o vaciarlo definitivamente cuando quieras.
        </p>

        {/* Contenedor de Botones Inferiores */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* Botón Cancelar */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
              color: 'var(--theme-text-main, #f8fafc)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
            }}
            className="w-full order-2 sm:order-1 px-5 py-3 rounded-xl border font-medium transition-colors duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          {/* Botón Mover a Papelera */}
          <button
            type="button"
            onClick={onConfirmar}
            disabled={isDeleting}
            className="w-full order-1 sm:order-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors duration-200 shadow-lg shadow-rose-900/20 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Moviendo...' : 'Mover a Papelera'}
          </button>
        </div>

      </div>
    </div>
  );
};
