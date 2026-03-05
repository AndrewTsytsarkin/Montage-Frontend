import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { ProjectObject, CreateUpdateObjectDto, AvailableUser } from '../types';
 
const AdminObjects = () => {
  const { user    } = useAuth();
  const navigate = useNavigate();
  
  const [objects, setObjects] = useState<ProjectObject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Форма создания/редактирования
  const [showForm, setShowForm] = useState(false);
  const [editingObject, setEditingObject] = useState<ProjectObject | null>(null);
  const [formData, setFormData] = useState<CreateUpdateObjectDto>({
    name: '',
    address: '',
    status: 'В работе',
    description: '',
    assignedUserIds: []
  });
  const [availableWorkers, setAvailableWorkers] = useState<AvailableUser[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      navigate('/objects');
      return;
    }
    loadObjects();
  }, []);

  const loadObjects = async () => {
    setLoading(true);
    try {
      const response = await api.get<ProjectObject[]>('/adminobjects/objects');
      setObjects(response.data);
    } catch (error) {
      console.error(error);
      setError('Ошибка загрузки объектов');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      const response = await api.get<AvailableUser[]>('/admin/users');
      setAvailableWorkers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const openCreateForm = async () => {
    setEditingObject(null);
    setFormData({
      name: '',
      address: '',
      status: 'В работе',
      description: '',
      assignedUserIds: []
    });
    await loadWorkers();
    setShowForm(true);
  };

  const openEditForm = async (obj: ProjectObject) => {
    setEditingObject(obj);
    setFormData({
      name: obj.name,
      address: obj.address,
      status: obj.status,
      description: obj.description,
      assignedUserIds: obj.assignedUsers?.map(u => u.userId) || []
    });
    
    // Загружаем объект с полными данными для редактирования
    try {
      const response = await api.get<ProjectObject>(`/adminobjects/objects/${obj.id}`);
      setAvailableWorkers(response.data.availableUsers || []);
    } catch (error) {
      console.error(error);
      await loadWorkers();
    }
    
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingObject(null);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkerToggle = (userId: number) => {
    setFormData(prev => {
      const assigned = prev.assignedUserIds || [];
      if (assigned.includes(userId)) {
        return { ...prev, assignedUserIds: assigned.filter(id => id !== userId) };
      } else {
        return { ...prev, assignedUserIds: [...assigned, userId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editingObject) {
        // Обновление
        await api.put(`/adminobjects/objects/${editingObject.id}`, formData);
        alert('Объект обновлён!');
      } else {
        // Создание
        await api.post('/adminobjects/objects', formData);
        alert('Объект создан!');
      }
      closeForm();
      loadObjects();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот объект? Все назначения будут удалены.')) return;

    try {
      await api.delete(`/adminobjects/objects/${id}`);
      loadObjects();
      alert('Объект удалён!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
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
            <h1 style={{ margin: '0 0 10px 0' }}>🏢 Управление объектами</h1>
            <p style={{ margin: '5px 0', opacity: 0.9 }}>Создание, редактирование и назначение монтажников</p>
          </div>
          <button 
            onClick={() => navigate('/objects')}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}
          >
            ← К выбору объекта
          </button>
        </div>
      </div>

      {/* Кнопка создания */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={openCreateForm}
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
          + Добавить объект
        </button>
      </div>

      {/* Таблица объектов */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '15px 20px', background: '#673ab7', color: 'white' }}>
          <h2 style={{ margin: 0 }}>📋 Объекты ({objects.length})</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Название</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Адрес</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Статус</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Монтажники</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Создан</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {objects.map(obj => (
                <tr key={obj.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{obj.name}</strong>
                    {obj.description && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {obj.description.length > 50 ? obj.description.substring(0, 50) + '...' : obj.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#666' }}>{obj.address}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: obj.status === 'В работе' ? '#4caf50' : obj.status === 'Завершен' ? '#9e9e9e' : '#2196f3',
                      color: 'white'
                    }}>
                      {obj.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {obj.assignedUsers?.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {obj.assignedUsers.slice(0, 3).map(u => (
                          <span key={u.userId} style={{
                            padding: '2px 8px',
                            background: '#e3f2fd',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}>
                            {u.fullName || u.login}
                          </span>
                        ))}
                        {obj.assignedUsers.length > 3 && (
                          <span style={{ fontSize: '11px', color: '#666' }}>
                            +{obj.assignedUsers.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>Не назначены</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>
                    {obj.createdAt ? new Date(obj.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => openEditForm(obj)}
                        style={{ background: '#2196f3', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(obj.id)}
                        style={{ background: '#f44336', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно формы */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '25px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>
                {editingObject ? '✏️ Редактировать объект' : '🆕 Новый объект'}
              </h2>
              <button
                onClick={closeForm}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Название объекта *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Адрес *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Статус *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="В работе">В работе</option>
                  <option value="Завершен">Завершен</option>
                  <option value="На планировании">На планировании</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px', fontFamily: 'inherit' }}
                  placeholder="Дополнительная информация об объекте..."
                />
              </div>

              {/* Назначение монтажников */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>👷 Назначить монтажников</label>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  background: '#fafafa'
                }}>
                  {availableWorkers.length === 0 ? (
                    <div style={{ padding: '15px', color: '#666', textAlign: 'center' }}>
                      Нет доступных монтажников
                    </div>
                  ) : (
                    availableWorkers.map(worker => (
                      <label
                        key={worker.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 15px',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          background: formData.assignedUserIds?.includes(worker.id) ? '#e3f2fd' : 'transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.assignedUserIds?.includes(worker.id) || false}
                          onChange={() => handleWorkerToggle(worker.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ flex: 1 }}>
                          <strong>{worker.fullName || worker.login}</strong>
                          {worker.isAssigned && !formData.assignedUserIds?.includes(worker.id) && (
                            <span style={{ marginLeft: '8px', fontSize: '11px', color: '#ff9800' }}>
                              (назначен на другой объект)
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Кнопки */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: submitting ? '#ccc' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {submitting ? 'Сохранение...' : editingObject ? '💾 Сохранить изменения' : '✅ Создать объект'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: '#9e9e9e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminObjects;