import React, { useState } from 'react';
import { Category } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Plus, Edit2, Trash2, Check, X, Tags, Info } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onCreateCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: number, name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await onCreateCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await onUpdateCategory(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (window.confirm(`¿Seguro que deseas eliminar la categoría "${cat.name}"?`)) {
      setIsLoading(true);
      setError(null);
      try {
        await onDeleteCategory(cat.id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al eliminar categoría');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
        <Tags className="text-amber-400 mt-0.5 shrink-0" size={20} />
        <div className="text-xs text-slate-300">
          <p className="font-semibold text-white mb-1">Gestión de Categorías</p>
          <p className="text-slate-400 leading-relaxed">
            Las categorías organizan tus tareas y eventos diarios. Si eliminas una categoría,
            el sistema utiliza borrado lógico y previene la eliminación si tiene tareas asociadas.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <Info size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create Category Form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="Nombre de la nueva categoría..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="gold"
          isLoading={isLoading}
          disabled={!newCategoryName.trim()}
          className="shrink-0"
        >
          <Plus size={16} />
          <span>Agregar</span>
        </Button>
      </form>

      {/* Categories List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Categorías Activas ({categories.length})
        </h3>

        <div className="grid gap-2">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 transition-all"
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat.id)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                      aria-label="Confirmar edición"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                      aria-label="Cancelar edición"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" size="md">
                        {cat.name}
                      </Badge>
                      <span className="text-[10px] text-slate-500 font-mono">#{cat.id}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        aria-label="Editar categoría"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        aria-label="Eliminar categoría"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No hay categorías cargadas aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
