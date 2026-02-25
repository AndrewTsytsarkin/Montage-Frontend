import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { ProjectObject } from '../types';
 
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [objects, setObjects] = useState<ProjectObject[]>([]);

  useEffect(() => {
    api.get<ProjectObject[]>('/objects').then((res) => setObjects(res.data));
  }, []);

  if (!user) return null;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Объекты ({user.role})</h1>
        <button onClick={logout}>Выйти</button>
      </div>
      {user.role === 'Admin' && <button style={{ background: 'green', color: 'white', marginBottom: '10px' }}>+ Добавить</button>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {objects.map((obj) => (
          <div key={obj.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>{obj.name}</h3>
            <p>{obj.address}</p>
            <p>Статус: {obj.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;