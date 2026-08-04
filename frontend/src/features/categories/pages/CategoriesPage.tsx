import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/shared/api/client';
import AppModal from '@/shared/components/AppModal';
import LoadingState from '@/shared/components/LoadingState';

const COLORS = ['#2a95ff','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#8b5cf6','#ec4899','#14b8a6'];
const ICONS = ['tag','utensils','home','car','heart-pulse','graduation-cap','shopping-bag','gamepad-2','receipt','briefcase','gift','more-horizontal'];

const CategoryModal: React.FC<{ cat?: any; typeFilter: 'INCOME'|'EXPENSE'; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({ cat, typeFilter, onClose, onSave, loading }) => {
  const [form, setForm] = useState({ name: cat?.name || '', type: cat?.type || typeFilter, color: cat?.color || COLORS[0], icon: cat?.icon || ICONS[0] });

  return (
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">{cat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên danh mục</label>
            <input
              id="category-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="VD: Café, Gym, Học phí..."
              className="app-input"
            />
          </div>

          {!cat && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại</label>
              <div className="flex gap-2">
                {(['INCOME', 'EXPENSE'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    id={`category-type-${t.toLowerCase()}`}
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${form.type === t
                      ? t === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                       : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    {t === 'INCOME' ? '↑ Thu nhập' : '↓ Chi tiêu'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Màu sắc</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${form.icon === icon ? 'bg-brand-600/20 border-brand-500/40 text-brand-600 dark:text-brand-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: form.color + '20', color: form.color }}>
              {form.name ? form.name[0].toUpperCase() : '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{form.name || 'Tên danh mục'}</p>
              <p className="text-xs text-slate-500">{form.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="app-secondary-button flex-1">Hủy</button>
          <button
            id="category-save"
            onClick={() => onSave(form)}
            disabled={loading || !form.name}
            className="app-primary-button flex-1"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {cat ? 'Lưu thay đổi' : 'Thêm'}
          </button>
        </div>
    </AppModal>
  );
};

const CategoriesPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'EXPENSE'|'INCOME'>('EXPENSE');

  const { data: allCategories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/categories', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/categories/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setEditCat(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const filtered = allCategories.filter((c: any) => c.type === activeTab);
  const systemCats = filtered.filter((c: any) => c.userId === null);
  const userCats = filtered.filter((c: any) => c.userId !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Danh mục</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Quản lý danh mục thu nhập và chi tiêu</p>
        </div>
        <button id="add-category-btn" onClick={() => setShowModal(true)} className="app-primary-button">
          <Plus size={16} /><span>Thêm danh mục</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 w-fit shadow-sm">
        {[{ key: 'EXPENSE', label: 'Chi tiêu', icon: TrendingDown }, { key: 'INCOME', label: 'Thu nhập', icon: TrendingUp }].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key.toLowerCase()}`}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === key
              ? key === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          {userCats.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Danh mục của bạn</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {userCats.map((cat: any) => (
                  <div key={cat.id} className="app-card app-card-hover p-4 flex flex-col items-center gap-2 group relative">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: cat.color + '20', color: cat.color }}>
                      {cat.name[0].toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 text-center leading-tight">{cat.name}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition absolute top-2 right-2">
                      <button id={`edit-cat-${cat.id}`} onClick={() => setEditCat(cat)} className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"><Pencil size={12} /></button>
                      <button id={`del-cat-${cat.id}`} onClick={() => { if (confirm(`Xóa "${cat.name}"?`)) deleteMutation.mutate(cat.id); }} className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Danh mục mặc định</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {systemCats.map((cat: any) => (
                <div key={cat.id} className="app-card p-4 flex flex-col items-center gap-2 opacity-80">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: cat.color + '20', color: cat.color }}>
                    {cat.name[0].toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">{cat.name}</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Mặc định</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && <CategoryModal typeFilter={activeTab} onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editCat && <CategoryModal cat={editCat} typeFilter={editCat.type} onClose={() => setEditCat(null)} onSave={(d) => updateMutation.mutate({ id: editCat.id, data: d })} loading={updateMutation.isPending} />}
    </div>
  );
};

export default CategoriesPage;
