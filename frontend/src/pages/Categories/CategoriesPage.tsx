import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppButton from '@/components/common/AppButton/AppButton';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/services/api/client';
import AppModal from '@/components/common/AppModal/AppModal';
import LoadingState from '@/components/common/LoadingState/LoadingState';

const COLORS = ['#2a95ff','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#8b5cf6','#ec4899','#14b8a6'];
const ICONS = ['tag','utensils','home','car','heart-pulse','graduation-cap','shopping-bag','gamepad-2','receipt','briefcase','gift','more-horizontal'];

const CategoryModal: React.FC<{ cat?: any; typeFilter: 'INCOME'|'EXPENSE'; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({ cat, typeFilter, onClose, onSave, loading }) => {
  const [form, setForm] = useState({ name: cat?.name || '', type: cat?.type || typeFilter, color: cat?.color || COLORS[0], icon: cat?.icon || ICONS[0] });

  return (
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">{cat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h2>
          <AppButton unstyled onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition"><X size={20} /></AppButton>
        </div>

        <div className="space-y-4">
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên danh mục</AppLabel>
            <AppInput unstyled
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
              <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại</AppLabel>
              <div className="flex gap-2">
                {(['INCOME', 'EXPENSE'] as const).map((t) => (
                  <AppButton unstyled
                    key={t}
                    type="button"
                    id={`category-type-${t.toLowerCase()}`}
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${form.type === t
                      ? t === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                       : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    {t === 'INCOME' ? '↑ Thu nhập' : '↓ Chi tiêu'}
                  </AppButton>
                ))}
              </div>
            </div>
          )}

          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Màu sắc</AppLabel>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <AppButton unstyled
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
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Icon</AppLabel>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin">
              {ICONS.map((icon) => (
                <AppButton unstyled
                  key={icon}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${form.icon === icon ? 'bg-brand-600/20 border-brand-500/40 text-brand-600 dark:text-brand-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {icon}
                </AppButton>
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
          <AppButton unstyled onClick={onClose} className="app-secondary-button flex-1">Hủy</AppButton>
          <AppButton unstyled
            id="category-save"
            onClick={() => onSave(form)}
            disabled={loading || !form.name}
            className="app-primary-button flex-1"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {cat ? 'Lưu thay đổi' : 'Thêm'}
          </AppButton>
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
    <div>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] font-extrabold leading-[1.3] tracking-normal text-black dark:text-slate-100">Danh mục</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Quản lý danh mục thu nhập và chi tiêu</p>
        </div>
        <AppButton unstyled id="add-category-btn" onClick={() => setShowModal(true)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00699b] px-4 font-bold text-white shadow-[0_3px_8px_rgba(0,105,155,0.24)] transition hover:bg-[#005b87]">
          <Plus size={16} /><span>Thêm danh mục</span>
        </AppButton>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex w-fit gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[{ key: 'EXPENSE', label: 'Chi tiêu', icon: TrendingDown }, { key: 'INCOME', label: 'Thu nhập', icon: TrendingUp }].map(({ key, label, icon: Icon }) => (
          <AppButton unstyled
            key={key}
            id={`tab-${key.toLowerCase()}`}
            onClick={() => setActiveTab(key as any)}
            className={`flex h-9 items-center gap-2 rounded-full px-5 font-semibold transition-all ${activeTab === key
              ? key === 'INCOME' ? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-600 shadow-sm dark:bg-rose-500/15 dark:text-rose-300'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Icon size={15} />
            {label}
          </AppButton>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="mt-6 space-y-7">
          {userCats.length > 0 && (
            <div>
              <h2 className="mb-3 text-[18px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Danh mục của bạn</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {userCats.map((cat: any) => (
                  <div key={cat.id} className="group relative flex min-h-[138px] flex-col items-center justify-center gap-2 rounded-lg border border-white/80 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_9px_24px_rgba(15,23,42,0.09)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full font-bold" style={{ background: cat.color + '20', color: cat.color }}>
                      {cat.name[0].toUpperCase()}
                    </div>
                    <p className="py-0.5 text-center font-semibold leading-[1.5] text-slate-950 dark:text-slate-100">{cat.name}</p>
                    <div className="absolute right-2 top-2 flex gap-1 rounded-md bg-white/90 opacity-0 shadow-sm transition group-hover:opacity-100 focus-within:opacity-100 dark:bg-slate-900/90">
                      <AppButton unstyled id={`edit-cat-${cat.id}`} aria-label={`Chỉnh sửa ${cat.name}`} onClick={() => setEditCat(cat)} className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"><Pencil size={14} /></AppButton>
                      <AppButton unstyled id={`del-cat-${cat.id}`} aria-label={`Xóa ${cat.name}`} onClick={() => { if (confirm(`Xóa "${cat.name}"?`)) deleteMutation.mutate(cat.id); }} className="rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><Trash2 size={14} /></AppButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-[18px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Danh mục mặc định</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {systemCats.map((cat: any) => (
                <div key={cat.id} className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-lg border border-white/80 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full font-bold" style={{ background: cat.color + '20', color: cat.color }}>
                    {cat.name[0].toUpperCase()}
                  </div>
                  <p className="py-0.5 text-center font-semibold leading-[1.5] text-slate-800 dark:text-slate-200">{cat.name}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Mặc định</span>
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
