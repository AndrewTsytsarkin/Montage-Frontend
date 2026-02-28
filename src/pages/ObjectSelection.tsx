// src/pages/ObjectSelection.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
 import type { ProjectObject } from '../types';
import { useObjectSelection } from '../context/src/context/ObjectSelectionContext';
 
const ObjectSelection = () => {
  const { user, logout } = useAuth();
  const { setSelectedObject } = useObjectSelection();
  const navigate = useNavigate();
  const [objects, setObjects] = useState<ProjectObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем доступные объекты для пользователя
    api.get<ProjectObject[]>('/objects')
      .then(res => {
        setObjects(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSelectObject = (obj: ProjectObject) => {
    setSelectedObject(obj);
    navigate('/reports');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <p>Загрузка объектов...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Выберите объект</h1>
          <p>Пользователь: <strong>{user?.fullName || user?.login}</strong> {user?.role==='Admin'?user?.role:''}</p>
         </div>
        <button onClick={logout} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Выйти
        </button>
      </div>

      {objects.length === 0 ? (
        <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <p>⚠️ У вас нет доступных объектов. Обратитесь к администратору.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {objects.map(obj => (
            <div
              key={obj.id}
              onClick={() => handleSelectObject(obj)}
              style={{
                border: '2px solid #007bff',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{obj.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>📍 {obj.address}</p>
              <p style={{ margin: '5px 0' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: obj.status === 'В работе' ? '#28a745' : obj.status === 'Завершен' ? '#6c757d' : '#17a2b8',
                  color: 'white'
                }}>
                  {obj.status}
                </span>
              </p>
              <button style={{
                marginTop: '15px',
                width: '100%',
                padding: '10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Открыть отчеты
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectSelection;