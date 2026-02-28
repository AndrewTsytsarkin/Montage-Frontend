// src/context/ObjectSelectionContext.tsx
import { createContext, useState, useContext, type ReactNode } from 'react';
import type { ObjectSelectionContextType, ProjectObject } from '../../../types';
 
const ObjectSelectionContext = createContext<ObjectSelectionContextType | null>(null);

interface ObjectSelectionProviderProps {
  children: ReactNode;
}

export const ObjectSelectionProvider = ({ children }: ObjectSelectionProviderProps) => {
  const [selectedObject, setSelectedObject] = useState<ProjectObject | null>(null);

  const clearSelection = () => {
    setSelectedObject(null);
  };

  return (
    <ObjectSelectionContext.Provider value={{ selectedObject, setSelectedObject, clearSelection }}>
      {children}
    </ObjectSelectionContext.Provider>
  );
};

export const useObjectSelection = (): ObjectSelectionContextType => {
  const context = useContext(ObjectSelectionContext);
  if (!context) {
    throw new Error('useObjectSelection must be used within ObjectSelectionProvider');
  }
  return context;
};