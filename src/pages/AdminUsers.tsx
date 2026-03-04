import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import type { AdminStats } from '../types/Dtos';
 
const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Форма создания пользователя
  const [showForm, setShowForm] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Worker'>('Worker');
  const [error, setError] = useState('');

  // Редактирование
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'Admin' | 'Worker'>('Worker');

  useEffect(() => {
    // Проверка: только админ
    if (user?.role !== 'Admin') {
      navigate('/objects');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get<User[]>('/admin/users'),
        api.get<AdminStats>('/admin/stats')
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newLogin || !newPassword) {
      setError('Логин и пароль обязательны');
      return;
    }

    try {
      await api.post('/admin/users', {
        login: newLogin,
        password: newPassword,
        fullName: newFullName,
        role: newRole
      });

      // Сброс формы
      setNewLogin('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('Worker');
      setShowForm(false);
      loadData();
      alert('Пользователь создан!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка создания пользователя');
    }
  };

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditFullName(user.fullName || '');
    setEditRole(user.role);
  };

  const handleUpdateUser = async (id: number) => {
    try {
      await api.put(`/admin/users/${id}`, {
        fullName: editFullName,
        role: editRole
      });
      setEditingId(null);
      loadData();
      alert('Пользователь обновлён!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка обновления');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Удалить этого пользователя?')) return;

    try {
      await api.delete(`/admin/users/${id}`);
      loadData();
      alert('Пользователь удалён!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Шапка */}
      <div style={{ 
        background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0' }}>👑 Панель администратора</h1>
            <p style={{ margin: '5px 0', opacity: 0.9 }}>Управление пользователями</p>
          </div>
          <button 
            onClick={() => navigate('/objects')}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}
          >
            ← К объектам
          </button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px' 
        }}>
          <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>{stats.totalUsers}</p>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Пользователей</p>
          </div>
          <div style={{ background: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#7b1fa2' }}>{stats.adminCount}</p>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Администраторов</p>
          </div>
          <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#388e3c' }}>{stats.workerCount}</p>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Монтажников</p>
          </div>
          <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#f57c00' }}>{stats.totalWorks}</p>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Выполнено работ</p>
          </div>
        </div>
      )}

      {/* Кнопка создания пользователя */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {showForm ? '✕ Отменить' : '+ Добавить пользователя'}
        </button>
      </div>

      {/* Форма создания */}
      {showForm && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '2px solid #4caf50'
        }}>
          <h2>📝 Новый пользователь</h2>
          {error && (
            <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Логин *</label>
              <input
                type="text"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Пароль *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ФИО</label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Роль *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'Admin' | 'Worker')}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="Worker">Монтажник</option>
                <option value="Admin">Администратор</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                gridColumn: '1 / -1',
                padding: '12px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ✓ Создать пользователя
            </button>
          </form>
        </div>
      )}

      {/* Таблица пользователей */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '15px 20px', background: '#673ab7', color: 'white' }}>
          <h2 style={{ margin: 0 }}>👥 Пользователи ({users.length})</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Логин</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ФИО</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Роль</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Создан</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isEditing = editingId === u.id;
                const isCurrentUser = u.id === user?.id;

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{u.id}</td>
                    <td style={{ padding: '12px' }}>
                      <strong>{u.login}</strong>
                      {isCurrentUser && (
                        <span style={{ marginLeft: '8px', padding: '2px 6px', background: '#2196f3', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                          Вы
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #2196f3', width: '200px' }}
                        />
                      ) : (
                        u.fullName || '—'
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'Admin' | 'Worker')}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #2196f3' }}
                        >
                          <option value="Worker">Монтажник</option>
                          <option value="Admin">Администратор</option>
                        </select>
                      ) : (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: u.role === 'Admin' ? '#7b1fa2' : '#388e3c',
                          color: 'white'
                        }}>
                          {u.role === 'Admin' ? '👑 Админ' : '🔧 Монтажник'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleUpdateUser(u.id)}
                            style={{ background: '#4caf50', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={{ background: '#9e9e9e', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => startEditing(u)}
                            style={{ background: '#2196f3', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                            disabled={isCurrentUser}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ background: '#f44336', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                            disabled={isCurrentUser}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;