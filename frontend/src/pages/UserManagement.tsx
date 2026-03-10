import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  canAccessSleep: boolean;
  canAccessWorkouts: boolean;
  canAccessNutrition: boolean;
  canAccessHealth: boolean;
  canAccessGoals: boolean;
}

interface FormData {
  email: string;
  name: string;
  password: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ email: '', name: '', password: '' });
  const [message, setMessage] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<any>({});

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin/users/list/all`, { headers });
      setUsers(res.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setMessage('❌ Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email, name: user.name, password: '' });
      setSelectedPermissions({
        canAccessSleep: user.canAccessSleep,
        canAccessWorkouts: user.canAccessWorkouts,
        canAccessNutrition: user.canAccessNutrition,
        canAccessHealth: user.canAccessHealth,
        canAccessGoals: user.canAccessGoals,
      });
    } else {
      setEditingUser(null);
      setFormData({ email: '', name: '', password: '' });
      setSelectedPermissions({
        canAccessSleep: true,
        canAccessWorkouts: true,
        canAccessNutrition: true,
        canAccessHealth: true,
        canAccessGoals: true,
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ email: '', name: '', password: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Atualizar usuário e permissões
        await axios.put(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
          email: formData.email,
          name: formData.name
        }, { headers });

        await axios.put(`${API_BASE_URL}/api/admin/users/${editingUser.id}/permissions`, 
          selectedPermissions, { headers });

        setMessage('✅ Usuário e permissões atualizados!');
      } else {
        // Criar novo usuário
        await axios.post(`${API_BASE_URL}/api/admin/users`, {
          email: formData.email,
          name: formData.name,
          password: formData.password
        }, { headers });

        setMessage('✅ Usuário criado com sucesso!');
      }

      fetchUsers();
      handleCloseForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro ao processar'));
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Deseja remover este usuário?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, { headers });
      setMessage('✅ Usuário removido com sucesso');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro ao deletar'));
    }
  };

  const handlePermissionChange = (permission: string) => {
    setSelectedPermissions({
      ...selectedPermissions,
      [permission]: !selectedPermissions[permission]
    });
  };

  const modules = [
    { key: 'canAccessSleep', label: 'Sono', icon: 'bi-moon' },
    { key: 'canAccessWorkouts', label: 'Treinos', icon: 'bi-fire' },
    { key: 'canAccessNutrition', label: 'Nutrição', icon: 'bi-cup' },
    { key: 'canAccessHealth', label: 'Saúde', icon: 'bi-heart' },
    { key: 'canAccessGoals', label: 'Metas', icon: 'bi-target' }
  ];

  return (
    <div className="container py-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-black text-dark mb-1">
            <i className="bi bi-people text-primary me-2"></i>
            Gerenciar Usuários
          </h1>
          <p className="text-secondary lead fs-6">Gerencie usuários, permissões e acessos ao sistema</p>
        </div>
        <button className="btn btn-primary btn-lg rounded-3" onClick={() => handleOpenForm()}>
          <i className="bi bi-plus-circle me-2"></i>Novo Usuário
        </button>
      </div>

      {message && (
        <div className={`alert alert-dismissible fade show rounded-4 shadow-sm border-0 mb-4 ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          <div className="d-flex align-items-center">
            <i className={`bi ${message.includes('✅') ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message}
          </div>
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom border-light">
                <h5 className="modal-title fw-bold">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseForm}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input
                      type="email"
                      className="form-control rounded-2"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={!editingUser ? false : true}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Nome</label>
                    <input
                      type="text"
                      className="form-control rounded-2"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  {!editingUser && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">Senha</label>
                      <input
                        type="password"
                        className="form-control rounded-2"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="form-label fw-bold d-block mb-3">Permissões de Acesso</label>
                    <div className="row g-3">
                      {modules.map((module) => (
                        <div key={module.key} className="col-6">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={module.key}
                              checked={selectedPermissions[module.key] || false}
                              onChange={() => handlePermissionChange(module.key)}
                            />
                            <label className="form-check-label" htmlFor={module.key}>
                              <i className={`bi ${module.icon} me-2`}></i>
                              {module.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-secondary rounded-2" onClick={handleCloseForm}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary rounded-2">
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Usuários */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-info rounded-4">
          <i className="bi bi-info-circle me-2"></i>
          Nenhum usuário encontrado
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded-4 overflow-hidden">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Email</th>
                <th>Nome</th>
                <th>Registrado em</th>
                <th>Permissões</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="fw-bold">{user.email}</td>
                  <td>{user.name}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {user.canAccessSleep && <span className="badge bg-primary-subtle text-primary">Sono</span>}
                      {user.canAccessWorkouts && <span className="badge bg-danger-subtle text-danger">Treinos</span>}
                      {user.canAccessNutrition && <span className="badge bg-success-subtle text-success">Nutrição</span>}
                      {user.canAccessHealth && <span className="badge bg-warning-subtle text-warning">Saúde</span>}
                      {user.canAccessGoals && <span className="badge bg-info-subtle text-info">Metas</span>}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary rounded-2 me-2"
                      onClick={() => handleOpenForm(user)}
                    >
                      <i className="bi bi-pencil"></i> Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger rounded-2"
                      onClick={() => handleDelete(user.id)}
                    >
                      <i className="bi bi-trash"></i> Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
