import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { X, Save, Trash2, User, UserPlus, Heart } from 'lucide-react';

interface MemberModalProps {
  member?: Partial<Member>;
  members: Member[];
  onClose: () => void;
  onSave: (member: Partial<Member>) => void;
  onDelete?: (id: number) => void;
}

export default function MemberModal({ member, members, onClose, onSave, onDelete }: MemberModalProps) {
  const [formData, setFormData] = useState<Partial<Member>>(
    member || {
      name: '',
      gender: 'male',
      generation: 1,
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-olive text-white">
          <h2 className="text-2xl font-semibold">
            {formData.id ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-8 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Họ và tên</label>
                <input
                  required
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans text-sm"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans text-sm"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Số điện thoại</label>
                <input
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans text-sm"
                  placeholder="090..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Địa chỉ (Xã, Tỉnh...)</label>
                <input
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans text-sm"
                  placeholder="Xã A, Huyện B, Tỉnh C"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Ngày/Năm sinh</label>
                <input
                  name="birth_date"
                  value={formData.birth_date || ''}
                  onChange={handleChange}
                  placeholder="YYYY hoặc DD-MM-YYYY"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Ngày/Năm mất (nếu có)</label>
                <input
                  name="death_date"
                  value={formData.death_date || ''}
                  onChange={handleChange}
                  placeholder="YYYY hoặc DD-MM-YYYY"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Nơi an táng</label>
                <input
                  name="burial_place"
                  value={formData.burial_place || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans text-sm"
                  placeholder="Nghĩa trang..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Đời thứ</label>
                <input
                  type="number"
                  name="generation"
                  value={formData.generation || 1}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Tên nhánh</label>
                <input
                  name="branch_name"
                  value={formData.branch_name || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans"
                  placeholder="Nhánh trưởng"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Con thứ mấy</label>
                <input
                  type="number"
                  name="child_order"
                  value={formData.child_order || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans"
                  placeholder="1, 2, 3..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Vợ/Chồng thứ mấy</label>
                <input
                  type="number"
                  name="spouse_order"
                  value={formData.spouse_order || ''}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans"
                  placeholder="1, 2, 3..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Quan hệ gia đình</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  name="father_id"
                  value={formData.father_id || ''}
                  onChange={handleChange}
                  className="p-3 rounded-xl border border-gray-200 outline-none sans text-sm"
                >
                  <option value="">Chọn Cha</option>
                  {members.filter(m => m.id !== formData.id && m.gender === 'male').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <select
                  name="mother_id"
                  value={formData.mother_id || ''}
                  onChange={handleChange}
                  className="p-3 rounded-xl border border-gray-200 outline-none sans text-sm"
                >
                  <option value="">Chọn Mẹ</option>
                  {members.filter(m => m.id !== formData.id && m.gender === 'female').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <select
                  name="spouse_id"
                  value={formData.spouse_id || ''}
                  onChange={handleChange}
                  className="p-3 rounded-xl border border-gray-200 outline-none sans text-sm"
                >
                  <option value="">Chọn Vợ/Chồng</option>
                  {members.filter(m => m.id !== formData.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">Tiểu sử</label>
              <textarea
                name="biography"
                value={formData.biography || ''}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans"
                placeholder="Thông tin thêm về thành viên..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 sans">URL Ảnh đại diện</label>
              <input
                name="photo_url"
                value={formData.photo_url || ''}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-olive focus:border-transparent outline-none transition-all sans"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            {formData.id && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(formData.id!)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors sans font-semibold"
              >
                <Trash2 size={20} />
                Xóa
              </button>
            )}
            <div className="flex gap-4 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-white transition-colors sans font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-olive text-white hover:opacity-90 transition-opacity shadow-lg shadow-olive/20 sans font-semibold"
              >
                <Save size={20} />
                Lưu thông tin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
