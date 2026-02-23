import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, TreeDeciduous, Users, Settings, Info, ChevronRight, Menu, X, Phone, MapPin, Home, Image as ImageIcon, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import FamilyTree from './components/FamilyTree';
import MemberModal from './components/MemberModal';
import { Member, TreeConfig } from './types';

type ViewMode = 'tree' | 'contacts' | 'settings';

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [config, setConfig] = useState<TreeConfig>({ title: 'Gia Phả Gia Đình' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  const [treeKey, setTreeKey] = useState(0);
  const configUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchConfig();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const text = await response.text();
      if (response.ok) {
        try {
          const data = JSON.parse(text);
          setMembers(data);
        } catch (e) {
          console.error('Failed to parse members JSON:', text);
        }
      } else {
        console.error('Failed to fetch members:', text);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const text = await response.text();
      if (response.ok) {
        try {
          const data = JSON.parse(text);
          if (data) setConfig(data);
        } catch (e) {
          console.error('Failed to parse config JSON:', text);
        }
      } else {
        console.error('Failed to fetch config:', text);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        alert('Đã lưu cài đặt thành công!');
      } else {
        let errorMessage = 'Không thể lưu cài đặt';
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        alert(`Lỗi: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<TreeConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    
    if (configUpdateTimer.current) {
      clearTimeout(configUpdateTimer.current);
    }

    configUpdateTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig),
        });
      } catch (error) {
        console.error('Failed to update config:', error);
      }
    }, 500);
  };

  const handleSaveMember = async (memberData: Partial<Member>) => {
    try {
      const url = memberData.id ? `/api/members/${memberData.id}` : '/api/members';
      const method = memberData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });

      if (response.ok) {
        if (!memberData.id) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#5A5A40', '#8B4513', '#f5f5f0']
          });
        }
        await fetchMembers();
        setIsModalOpen(false);
        setSelectedMember(undefined);
      } else {
        let errorMessage = 'Không thể lưu thành viên';
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        alert(`Lỗi: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to save member:', error);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;
    try {
      const response = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchMembers();
        setIsModalOpen(false);
        setSelectedMember(undefined);
      } else {
        let errorMessage = 'Không thể xóa thành viên';
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        alert(`Lỗi: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery) ||
      m.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-paper text-ink overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-gray-200 flex flex-col shadow-xl z-20"
      >
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-olive p-2 rounded-xl text-white">
            <TreeDeciduous size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight truncate">{config.title}</h1>
        </div>

        <nav className="p-2 flex gap-1 border-b border-gray-100">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'tree' ? 'bg-olive text-white' : 'hover:bg-gray-100'}`}
          >
            Sơ đồ
          </button>
          <button
            onClick={() => setViewMode('contacts')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'contacts' ? 'bg-olive text-white' : 'hover:bg-gray-100'}`}
          >
            Danh bạ
          </button>
          <button
            onClick={() => setViewMode('settings')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'settings' ? 'bg-olive text-white' : 'hover:bg-gray-100'}`}
          >
            Cài đặt
          </button>
        </nav>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-olive/20 outline-none transition-all sans text-sm"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-2 sans">
              {viewMode === 'contacts' ? 'Danh bạ gia đình' : 'Thành viên'}
            </p>
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMember(member);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-paper transition-colors text-left group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${member.death_date ? 'bg-gray-400' : 'bg-green-500'}`}>
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm">{member.name}</p>
                  {viewMode === 'contacts' ? (
                    <p className="text-[10px] text-gray-500 sans truncate">{member.phone || 'Chưa có SĐT'}</p>
                  ) : (
                    <p className="text-[10px] text-gray-500 sans">Đời thứ {member.generation}</p>
                  )}
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-olive transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
          <button
            onClick={() => {
              setSelectedMember(undefined);
              setIsModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-olive text-white py-3 rounded-xl font-bold shadow-lg shadow-olive/20 hover:opacity-90 transition-opacity sans"
          >
            <Plus size={20} />
            Thêm thành viên
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col">
        {/* Header */}
        <header className="absolute top-6 left-6 right-6 flex justify-between items-center z-30 pointer-events-none">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="pointer-events-auto bg-white p-3 rounded-xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center"
            title={isSidebarOpen ? "Đóng menu" : "Mở menu"}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="pointer-events-auto flex gap-3">
            <button
              onClick={() => {
                handleUpdateConfig({
                  tree_x: undefined,
                  tree_y: undefined,
                  tree_scale: undefined
                });
                setTreeKey(prev => prev + 1);
              }}
              className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 text-sm font-semibold hover:bg-gray-50 transition-colors sans"
            >
              Căn giữa sơ đồ
            </button>
            <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold sans">Trực tuyến</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'tree' && (
            <FamilyTree
              key={treeKey}
              members={members}
              config={config}
              onMemberClick={(member) => {
                setSelectedMember(member);
                setIsModalOpen(true);
              }}
              onConfigUpdate={handleUpdateConfig}
            />
          )}

          {viewMode === 'contacts' && (
            <div className="p-20 overflow-y-auto h-full bg-paper">
              <h2 className="text-4xl font-bold mb-10 text-olive">Danh bạ thành viên</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map(member => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${member.death_date ? 'bg-gray-400' : 'bg-green-500'}`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-xs text-gray-500 sans">Đời thứ {member.generation}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm sans">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone size={16} className="text-olive" />
                        <span>{member.phone || '---'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPin size={16} className="text-olive" />
                        <span className="truncate">{member.address || '---'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Home size={16} className="text-olive" />
                        <span className="truncate">{member.burial_place || '---'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setIsModalOpen(true);
                      }}
                      className="mt-6 w-full py-2 border border-gray-100 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-wider"
                    >
                      Chi tiết
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'settings' && (
            <div className="p-20 flex justify-center items-start h-full bg-paper overflow-y-auto">
              <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 w-full max-w-xl">
                <h2 className="text-3xl font-bold mb-8 text-olive">Cài đặt Gia Phả</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest sans">Các dòng tiêu đề</label>
                      <button
                        onClick={() => {
                          const currentLines = config.title_lines ? JSON.parse(config.title_lines) : [{ text: config.title, fontSize: config.title_font_size || 48 }];
                          const newLines = [...currentLines, { text: '', fontSize: 48 }];
                          setConfig({ ...config, title_lines: JSON.stringify(newLines) });
                        }}
                        className="text-xs font-bold text-olive hover:underline sans"
                      >
                        + Thêm dòng
                      </button>
                    </div>
                    
                    {(() => {
                      const lines = config.title_lines ? JSON.parse(config.title_lines) : [{ text: config.title, fontSize: config.title_font_size || 48 }];
                      return lines.map((line: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={line.text}
                              onChange={(e) => {
                                const newLines = [...lines];
                                newLines[idx].text = e.target.value;
                                setConfig({ ...config, title_lines: JSON.stringify(newLines), title: newLines[0].text });
                              }}
                              placeholder={`Dòng ${idx + 1}`}
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-olive/20 outline-none transition-all sans text-sm"
                            />
                          </div>
                          <div className="w-24 space-y-1">
                            <input
                              type="number"
                              value={line.fontSize}
                              onChange={(e) => {
                                const newLines = [...lines];
                                newLines[idx].fontSize = parseInt(e.target.value) || 48;
                                setConfig({ ...config, title_lines: JSON.stringify(newLines) });
                              }}
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-olive/20 outline-none transition-all sans text-sm"
                            />
                          </div>
                          {lines.length > 1 && (
                            <button
                              onClick={() => {
                                const newLines = lines.filter((_: any, i: number) => i !== idx);
                                setConfig({ ...config, title_lines: JSON.stringify(newLines), title: newLines[0]?.text || '' });
                              }}
                              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest sans">Phông chữ chung</label>
                      <select
                        value={config.title_font_family || 'Cormorant Garamond'}
                        onChange={(e) => setConfig({ ...config, title_font_family: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-olive/20 outline-none transition-all sans"
                      >
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="Inter">Inter</option>
                        <option value="serif">Serif</option>
                        <option value="sans-serif">Sans-Serif</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest sans">Ảnh nền (Cố định)</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={config.background_url || ''}
                            onChange={(e) => setConfig({ ...config, background_url: e.target.value })}
                            placeholder="URL ảnh hoặc tải lên..."
                            className="w-full pl-12 pr-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-olive/20 outline-none transition-all sans"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-olive/10 text-olive rounded-xl cursor-pointer hover:bg-olive/20 transition-colors sans font-bold text-sm">
                          <Plus size={18} />
                          Tải ảnh từ máy tính
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setConfig({ ...config, background_url: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {config.background_url && (
                          <button
                            onClick={() => setConfig({ ...config, background_url: '' })}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-6 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest sans">Ảnh chèn (Di chuyển được)</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={config.overlay_url || ''}
                            onChange={(e) => setConfig({ ...config, overlay_url: e.target.value })}
                            placeholder="URL ảnh hoặc tải lên..."
                            className="w-full pl-12 pr-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-olive/20 outline-none transition-all sans"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-olive/10 text-olive rounded-xl cursor-pointer hover:bg-olive/20 transition-colors sans font-bold text-sm">
                          <Plus size={18} />
                          Tải ảnh từ máy tính
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setConfig({ ...config, overlay_url: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {config.overlay_url && (
                          <button
                            onClick={() => setConfig({ ...config, overlay_url: '' })}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest sans">Tỷ lệ ảnh chèn: {config.overlay_scale?.toFixed(1) || '1.0'}</label>
                        <input
                          type="range"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={config.overlay_scale || 1}
                          onChange={(e) => setConfig({ ...config, overlay_scale: parseFloat(e.target.value) })}
                          className="w-full accent-olive"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSaveConfig}
                    className="w-full flex items-center justify-center gap-2 bg-olive text-white py-4 rounded-2xl font-bold shadow-lg shadow-olive/20 hover:opacity-90 transition-opacity sans mt-8"
                  >
                    <Save size={20} />
                    Lưu cài đặt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Actions */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-10">
          <div className="flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <button 
              onClick={() => {
                handleUpdateConfig({
                  tree_x: undefined,
                  tree_y: undefined,
                  tree_scale: undefined
                });
                setTreeKey(prev => prev + 1);
              }}
              className="p-4 hover:bg-gray-50 text-olive transition-colors border-b border-gray-100"
              title="Căn giữa"
            >
              <Home size={20} />
            </button>
            <button 
              onClick={() => setViewMode('settings')}
              className="p-4 hover:bg-gray-50 text-olive transition-colors"
              title="Cài đặt"
            >
              <Settings size={20} />
            </button>
          </div>
          
          <button className="bg-white p-4 rounded-full shadow-2xl border border-gray-100 hover:scale-110 transition-transform text-olive">
            <Info size={24} />
          </button>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <MemberModal
            member={selectedMember}
            members={members}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedMember(undefined);
            }}
            onSave={handleSaveMember}
            onDelete={handleDeleteMember}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
