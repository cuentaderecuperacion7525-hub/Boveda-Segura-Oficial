import React from 'react';
import { Share2, CopyPlus, Trash2, MoreVertical } from 'lucide-react';

export interface BarraAccionesProps {
  onCompartir: () => void;
  onCopiar: () => void;
  onEliminar: () => void;
  onMas: () => void;
  menuMasAbierto?: boolean;
  esInmersivo?: boolean;
}

export const BarraAccionesInferior: React.FC<BarraAccionesProps> = ({
  onCompartir,
  onCopiar,
  onEliminar,
  onMas,
  menuMasAbierto = false,
  esInmersivo = false,
}) => {
  return (
    <footer
      onClick={(e) => e.stopPropagation()}
      className={`fixed bottom-0 left-0 right-0 z-50 w-full bg-[#0a121d]/95 backdrop-blur-xl px-2 pt-2.5 pb-3 pb-safe flex items-center justify-around border-t border-slate-800/80 shadow-[0_-8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 select-none ${
        esInmersivo ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* 1. Compartir */}
      <button
        type="button"
        onClick={onCompartir}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-200 hover:text-[#00e5ff] active:scale-95 transition-all focus:outline-none cursor-pointer"
        aria-label="Compartir"
      >
        <Share2 size={22} strokeWidth={1.7} />
        <span className="text-[11px] font-medium tracking-tight">Compartir</span>
      </button>

      {/* 2. Copiar */}
      <button
        type="button"
        onClick={onCopiar}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-200 hover:text-[#00e5ff] active:scale-95 transition-all focus:outline-none cursor-pointer"
        aria-label="Copiar"
      >
        <CopyPlus size={22} strokeWidth={1.7} />
        <span className="text-[11px] font-medium tracking-tight">Copiar</span>
      </button>

      {/* 3. Eliminar */}
      <button
        type="button"
        onClick={onEliminar}
        className="vault-delete-btn flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-200 hover:text-rose-400 active:scale-95 transition-all focus:outline-none cursor-pointer"
        aria-label="Eliminar"
      >
        <Trash2 size={22} strokeWidth={1.7} />
        <span className="text-[11px] font-medium tracking-tight">Eliminar</span>
      </button>

      {/* 4. Más (3 puntitos verticales) */}
      <button
        type="button"
        onClick={onMas}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 active:scale-95 transition-all focus:outline-none cursor-pointer ${
          menuMasAbierto
            ? 'vault-more-btn-active text-[#00e5ff]'
            : 'text-slate-200 hover:text-[#00e5ff]'
        }`}
        aria-label="Más opciones"
      >
        <MoreVertical size={22} strokeWidth={1.7} />
        <span className="text-[11px] font-medium tracking-tight">Más</span>
      </button>
    </footer>
  );
};

