import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#2a95ff','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#8b5cf6','#ec4899','#14b8a6'];
const ICONS = ['tag','utensils','home','car','heart-pulse','graduation-cap','shopping-bag','gamepad-2','receipt','briefcase','gift','more-horizontal'];

const CategoryModal: React.FC<{ cat?: any; typeFilter: 'INCOME'|'EXPENSE'; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({ cat, typeFilter, onClose, onSave, loading }) => {
  const [form, setForm] = useState({ name: cat?.name || '', type: cat?.type || typeFilter, color: cat?.color || COLORS[0], icon: cat?.icon || ICONS[0] });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-100">{cat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên danh mục</label>
            <input
              id="category-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="VD: Café, Gym, Học phí..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>

          {!cat && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Loại</label>
              <div className="flex gap-2">
                {(['INCOME', 'EXPENSE'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    id={`category-type-${t.toLowerCase()}`}
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${form.type === t
                      ? t === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                  >
                    {t === 'INCOME' ? '↑ Thu nhập' : '↓ Chi tiêu'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Màu sắc</label>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${form.icon === icon ? 'bg-brand-600/20 border-brand-500/40 text-brand-400' : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: form.color + '20', color: form.color }}>
              {form.name ? form.name[0].toUpperCase() : '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{form.name || 'Tên danh mục'}</p>
              <p className="text-xs text-slate-500">{form.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition">Hủy</button>
          <button
            id="category-save"
            onClick={() => onSave(form)}
            disabled={loading || !form.name}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-semibold transition"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {cat ? 'Lưu thay đổi' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
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
          <h1 className="text-2xl font-bold text-slate-100">Danh mục</h1>
          <p className="text-slate-400 text-sm mt-0.5">Quản lý danh mục thu nhập và chi tiêu</p>
        </div>
        <button id="add-category-btn" onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition shadow-md shadow-brand-500/20 active:scale-95">
          <Plus size={16} /><span>Thêm danh mục</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
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
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
      ) : (
        <div className="space-y-6">
          {userCats.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Danh mục của bạn</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {userCats.map((cat: any) => (
                  <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-slate-700 transition-all group relative">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: cat.color + '20', color: cat.color }}>
                      {cat.name[0].toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-200 text-center leading-tight">{cat.name}</p>
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
                <div key={cat.id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 flex flex-col items-center gap-2 opacity-70">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: cat.color + '20', color: cat.color }}>
                    {cat.name[0].toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-slate-300 text-center leading-tight">{cat.name}</p>
                  <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Mặc định</span>
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
