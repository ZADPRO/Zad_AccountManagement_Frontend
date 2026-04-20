import { useState, useEffect, useRef } from 'react';
import UserTable from '@/components/ui/UserTable';
import UserModal from '../components/forms/UserModal';
import UserPreviewModal from '@/components/forms/UserPreviewModal'; 
import api from '@/api/api';

import { Toast } from 'primereact/toast'; 
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const UserManagement = () => {
  const toast = useRef<Toast>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); 
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Custom Delete Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try { 
        const res = await api.get('/users');
        if (res.data.status) {
          setUsers(res.data.users || []);
        }
      } catch (err) {
        console.error("Fetch users failed:", err);
      }
    };
    fetchUsers();
  }, [refreshKey]);

  const openModal = (user: any = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedUser(user);
    if (mode === 'view') {
      setIsPreviewOpen(true);
    } else {
      setModalMode(mode);
      setIsModalOpen(true);
    }
  };

  const handleSaveUser = async (userData: any) => {
    const isEdit = modalMode === 'edit';
    const endpoint = isEdit ? `/users/${userData.userId}` : `/users`;

    try {
      const res = isEdit 
        ? await api.put(endpoint, userData) 
        : await api.post(endpoint, userData);

      if (res.status === 200 || res.status === 201) {
        setRefreshKey(prev => prev + 1);
        setIsModalOpen(false);
       
      }
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || "Save failed" });
    }
  };

  // ✅ Trigger Custom Modal
  const triggerDelete = (user: any) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  // ✅ Actual Delete Execution
  const confirmDeleteAction = async () => {
    if (!userToDelete) return;
    try {
      const res = await api.delete(`/users/${userToDelete.userId}`, {
        data: { updatedBy: 5 }
      });

      if (res.status === 200) {
        setRefreshKey(prev => prev + 1);
        setIsDeleteOpen(false);
        setUserToDelete(null);
       
      }
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-2 space-y-8 min-h-screen bg-slate-50 text-slate-900">
      <Toast ref={toast} />
      
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Users</h1>
        </div>
      </header>

      {/* ✅ Search & Add (Aligned like Recipient Master) */}
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-4">
        <div className="relative w-full max-w-md h-12">
          <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full h-full pl-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-blue-500 transition-all"
          />
        </div>
        <Button 
          label="Add User" 
          icon="pi pi-plus" 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-600/10"
        />
      </div>

      <div className="bg-white rounded-4xl border border-slate-200 overflow-hidden shadow-sm">
        <UserTable 
          data={filteredUsers} 
          onDelete={triggerDelete} // Pass the custom trigger
          onEdit={(user, mode) => openModal(user, mode)} 
        />
      </div>

      <UserModal 
        key={selectedUser?.userId || 'new'}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser}
        userId={selectedUser?.userId}
        mode={modalMode}
      />

      <UserPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        userId={selectedUser?.userId}
      />

      {/* ✅ CUSTOM PINK DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                <i className="pi pi-exclamation-triangle text-2xl" />
              </div>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 mb-2">Confirm Deletion</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-700">"{userToDelete?.username}"</span>?
              </p>
              
              <div className="flex gap-3">
                <Button 
                  label="Cancel"
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 p-button-secondary p-button-text font-bold uppercase text-[10px] tracking-widest text-slate-400 border border-slate-200 rounded-2xl h-12"
                />
                <Button 
                  label="Delete"
                  onClick={confirmDeleteAction}
                  className="flex-1 bg-rose-500 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 border-none rounded-2xl h-12"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;