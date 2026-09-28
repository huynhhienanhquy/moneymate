import { webTheme } from '@moneymate/design-tokens';
import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppButton from '@/components/common/AppButton/AppButton';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, TrendingUp, TrendingDown, Shapes, Utensils, Sparkles } from 'lucide-react';
import api from '@/services/api/client';
import AppModal from '@/components/common/AppModal/AppModal';
import LoadingState from '@/components/common/LoadingState/LoadingState';
import PageHeader from '@/components/common/PageHeader/PageHeader';
import SummaryCard from '@/components/common/SummaryCard/SummaryCard';
import CategoryIcon from '@/components/common/CategoryIcon/CategoryIcon';

const COLORS = ['blue', 'income', 'warning', 'expense', 'purple', 'cyan', 'orange', 'violet', 'pink', 'teal'].map((name) => webTheme.chartColors[name as keyof typeof webTheme.chartColors]);
const ICONS = ['tag','utensils','home','car','heart-pulse','graduation-cap','shopping-bag','gamepad-2','receipt','briefcase','gift','more-horizontal'];

const CategoryModal: React.FC<{ cat?: any; typeFilter: 'INCOME'|'EXPENSE'; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({ cat, typeFilter, onClose, onSave, loading }) => {
  const [form, setForm] = useState({ name: cat?.name || '', type: cat?.type || typeFilter, color: cat?.color || COLORS[0], icon: cat?.icon || ICONS[0] });

  return (
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <AppTitle unstyled level={2} className="text-lg font-extrabold text-slate-950 dark:text-slate-100">{cat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</AppTitle>
          <AppButton unstyled onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition"><X className="size-5" /></AppButton>
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
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-icon-tile" style={{ background: form.color }}>
              <CategoryIcon name={form.icon} className="size-5" />
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
            {loading && <Loader2  className="size-4 animate-spin" />}
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
      <PageHeader
        eyebrow="Phân loại"
        title="Danh mục"
        description="Quản lý và cá nhân hóa danh mục thu chi tài chính của bạn"
        actions={(
          <AppButton unstyled id="add-category-btn" onClick={() => setShowModal(true)} className="app-primary-button">
            <Plus className="size-4" /><span>Thêm danh mục</span>
          </AppButton>
        )}
      />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={<Shapes className="size-5" />} label="Tổng số danh mục" value={`${allCategories.length} phân loại`} tone="blue" caption={`${allCategories.filter((c: any) => c.type === 'EXPENSE').length} Chi tiêu · ${allCategories.filter((c: any) => c.type === 'INCOME').length} Thu nhập`} />
        <SummaryCard icon={<Utensils className="size-5" />} label="Đang hiển thị" value={`${filtered.length} danh mục`} tone={activeTab === 'EXPENSE' ? 'red' : 'green'} caption={activeTab === 'EXPENSE' ? 'Nhóm chi tiêu' : 'Nhóm thu nhập'} />
        <SummaryCard icon={<Sparkles className="size-5" />} label="Danh mục tùy chỉnh" value={`${userCats.length} mục`} tone="violet" caption={userCats[0] ? 'Đã cá nhân hóa' : 'Chưa có danh mục riêng'} />
      </div>

      {/* Tabs */}
      <div className="mt-5 flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[{ key: 'EXPENSE', label: 'Chi tiêu', icon: TrendingDown }, { key: 'INCOME', label: 'Thu nhập', icon: TrendingUp }].map(({ key, label, icon: Icon }) => (
          <AppButton unstyled
            key={key}
            id={`tab-${key.toLowerCase()}`}
            onClick={() => setActiveTab(key as any)}
            className={`flex h-9 items-center gap-2 rounded-lg px-5 font-semibold transition-all ${activeTab === key
              ? key === 'INCOME' ? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-600 shadow-sm dark:bg-rose-500/15 dark:text-rose-300'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Icon className="size-icon-small" />
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
              <AppTitle unstyled level={2} className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white"><span className="size-2.5 rounded-full bg-blue-600" />Danh mục của bạn</AppTitle>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {userCats.map((cat: any) => (
                  <div key={cat.id} className="group relative flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-2xl border border-outline-variant/60 bg-gradient-to-b from-white to-surface-container-low p-5 shadow-category transition hover:-translate-y-0.5 hover:shadow-category-hover dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-icon-tile" style={{ background: cat.color }}>
                      <CategoryIcon name={cat.icon} className="size-6" />
                    </div>
                    <p className="mt-2 py-0.5 text-center text-base font-extrabold leading-normal text-slate-950 dark:text-slate-100">{cat.name}</p>
                    <p className="text-center text-xs text-slate-500">Danh mục {activeTab === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} tùy chỉnh</p>
                    <span className="mt-1 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-bold text-blue-600">Tùy chỉnh</span>
                    <div className="absolute right-2 top-2 flex gap-1 rounded-md bg-white/90 opacity-0 shadow-sm transition group-hover:opacity-100 focus-within:opacity-100 dark:bg-slate-900/90">
                      <AppButton unstyled id={`edit-cat-${cat.id}`} aria-label={`Chỉnh sửa ${cat.name}`} onClick={() => setEditCat(cat)} className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"><Pencil className="size-3.5" /></AppButton>
                      <AppButton unstyled id={`del-cat-${cat.id}`} aria-label={`Xóa ${cat.name}`} onClick={() => { if (confirm(`Xóa "${cat.name}"?`)) deleteMutation.mutate(cat.id); }} className="rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><Trash2 className="size-3.5" /></AppButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
              <AppTitle unstyled level={2} className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white"><span className="size-2.5 rounded-full bg-emerald-500" />Danh mục mặc định</AppTitle>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {systemCats.map((cat: any) => (
                <div key={cat.id} className="flex min-h-[232px] flex-col items-center justify-center gap-2 rounded-2xl border border-outline-variant/55 bg-gradient-to-b from-white to-surface-container-low p-5 shadow-category-system transition hover:-translate-y-0.5 hover:shadow-category dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-icon-tile" style={{ background: cat.color }}>
                    <CategoryIcon name={cat.icon} className="size-6" />
                  </div>
                  <p className="mt-2 py-0.5 text-center text-base font-extrabold leading-normal text-slate-800 dark:text-slate-200">{cat.name}</p>
                  <p className="min-h-8 text-center text-xs leading-5 text-slate-500">Danh mục {activeTab === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'} mặc định</p>
                  <span className="mt-1 rounded-full border border-outline-variant/60 bg-white/80 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Mặc định</span>
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
