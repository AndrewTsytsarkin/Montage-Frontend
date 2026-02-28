import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { WorkTypeDto } from '../types';
 
const WorkTypes = () => {
  const [workTypes, setWorkTypes] = useState<WorkTypeDto[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedType) params.append('type', selectedType);
    if (selectedSubtype) params.append('subtype', selectedSubtype);
    
    api.get<WorkTypeDto[]>(`/worktypes?${params.toString()}`)
      .then(res => setWorkTypes(res.data));
  }, [selectedType, selectedSubtype]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Справочник видов работ</h2>
      
      {/* Фильтры */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedSubtype(''); }}>
          <option value="">Все типы</option>
          <option value="Сверление, штробление и подрозетники">Сверление...</option>
        </select>
        
        <select value={selectedSubtype} onChange={(e) => setSelectedSubtype(e.target.value)} disabled={!selectedType}>
          <option value="">Все подтипы</option>
          <option value="Отверстия">Отверстия</option>
        </select>
      </div>

      {/* Список */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {workTypes.map(wt => (
          <div key={wt.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <strong>{wt.type}</strong> → <em>{wt.subtype}</em>
            <p style={{ margin: '10px 0' }}>{wt.name}</p>
            <span style={{ background: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
              {wt.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkTypes;