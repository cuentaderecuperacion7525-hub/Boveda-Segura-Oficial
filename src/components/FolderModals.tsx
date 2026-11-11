import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, X, Check, ArrowRight, Trash2, Edit2, Lock } from 'lucide-react';

import { VaultItemCategory } from '../db/vaultDb';
import { EXTRA_PIN_FOLDER_NAME, isExtraPinAlbum } from '../services/extraPinFolderService';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: VaultItemCategory;
  existingFolders: string[];
  onCreate: (folderName: string) => void;
}

export function CreateFolderModal({
  isOpen,
  onClose,
  category,
  existingFolders,
  onCreate,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const categoryLabel =
    category === 'photo'
      ? 'Imágenes'
      : category === 'video'
      ? 'Videos'
      : category === 'audio'
      ? 'Audio'
      : category === 'document'
      ? 'Documentos'
      : 'Archivos';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError('El nombre de la carpeta no puede estar vacío');
      return;
    }
    if (
      isExtraPinAlbum(trimmed) ||
      existingFolders.some((f) => f.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError('Ya existe una carpeta con este nombre');
      return;
    }

    onCreate(trimmed);
    setFolderName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Nueva Carpeta</h3>
              <p className="text-[11px] text-zinc-400">En la sección {categoryLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Nombre de la carpeta
            </label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError('');
              }}
              placeholder="Ej: Personal, Viajes, Trabajo..."
              maxLength={40}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Crear</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: VaultItemCategory;
  currentFolderName: string;
  existingFolders: string[];
  onRename: (oldName: string, newName: string) => void;
}

export function RenameFolderModal({
  isOpen,
  onClose,
  category,
  currentFolderName,
  existingFolders,
  onRename,
}: RenameFolderModalProps) {
  const [folderName, setFolderName] = useState(currentFolderName);
  const [error, setError] = useState('');

  useEffect(() => {
    setFolderName(currentFolderName);
    setError('');
  }, [currentFolderName, isOpen]);

  if (!isOpen) return null;

  const categoryLabel =
    category === 'photo'
      ? 'Imágenes'
      : category === 'video'
      ? 'Videos'
      : category === 'audio'
      ? 'Audio'
      : category === 'document'
      ? 'Documentos'
      : 'Archivos';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío');
      return;
    }
    if (
      isExtraPinAlbum(trimmed) ||
      (trimmed.toLowerCase() !== currentFolderName.toLowerCase() &&
        existingFolders.some((f) => f.toLowerCase() === trimmed.toLowerCase()))
    ) {
      setError('Ya existe otra carpeta con este nombre');
      return;
    }

    onRename(currentFolderName, trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Renombrar Carpeta</h3>
              <p className="text-[11px] text-zinc-400">En la sección {categoryLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Nuevo nombre
            </label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError('');
              }}
              maxLength={40}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || folderName.trim() === currentFolderName}
              className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  category: VaultItemCategory;
  currentFolder?: string | null;
  folders: string[];
  onMove: (targetFolder: string) => void;
  onOpenCreateFolder: () => void;
}

export function MoveToFolderModal({
  isOpen,
  onClose,
  selectedCount,
  category,
  currentFolder,
  folders,
  onMove,
  onOpenCreateFolder,
}: MoveToFolderModalProps) {
  if (!isOpen) return null;

  const categoryLabel =
    category === 'photo'
      ? 'imágenes'
      : category === 'video'
      ? 'videos'
      : category === 'audio'
      ? 'audios'
      : category === 'document'
      ? 'documentos'
      : 'archivos';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Mover a Carpeta</h3>
              <p className="text-[11px] text-zinc-400">
                {selectedCount} {categoryLabel} seleccionada(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Folder List */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
          {folders.map((folder) => {
            const isCurrent = currentFolder === folder;
            const isExtraPin = folder === EXTRA_PIN_FOLDER_NAME || isExtraPinAlbum(folder);
            return (
              <button
                key={folder}
                type="button"
                onClick={() => {
                  onMove(folder);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  isCurrent
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-semibold'
                    : 'bg-zinc-950/60 hover:bg-zinc-800/60 border-zinc-850 text-zinc-300 hover:text-zinc-100 hover:border-zinc-750'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {isExtraPin ? (
                    <Lock className="w-4 h-4 shrink-0 text-[#00e5ff]" />
                  ) : (
                    <Folder className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-amber-400' : 'text-zinc-500'}`} />
                  )}
                  <span className="text-xs truncate">{folder}</span>
                </div>
                {isCurrent ? (
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                    Actual
                  </span>
                ) : isExtraPin ? (
                  <span className="text-[10px] text-[#00e5ff] font-semibold shrink-0">
                    PIN extra
                  </span>
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action to create new folder directly */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateFolder();
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 transition-colors p-1 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Crear nueva carpeta</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
