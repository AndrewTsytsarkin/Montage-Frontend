export interface ProjectObject {
  id: number;
  name: string;
  address: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedUsers?: AssignedUser[];
  availableUsers?: AvailableUser[];
}

export interface AssignedUser {
  userId: number;
  login: string;
  fullName?: string;
}

export interface AvailableUser {
  id: number;
  login: string;
  fullName?: string;
  isAssigned: boolean;
}

export interface CreateUpdateObjectDto {
  name: string;
  address: string;
  status: string;
  description?: string;
  assignedUserIds?: number[];
}
export interface JwtPayload {
  sub: string;
  nameid: string;
  Login?: string;
  role: "Admin" | "Worker";
  exp: number;
  iat: number;
  FullName?:string;
}

export interface AuthContextType {
  user: User | null;
  login: (
    login: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
}

export interface ObjectSelectionContextType {
  selectedObject: ProjectObject | null;
  setSelectedObject: (obj: ProjectObject | null) => void;
  clearSelection: () => void;
}

export interface WorkType {
  id: number;
  type: string; // Тип: "Сверление, штробление и подрозетники"
  subtype: string; // Подтип: "Отверстия"
  name: string; // Полное описание работы
  unit: string; // Ед. измерения: "шт"
}


export interface WorkReport {
  id: number;
  userId: number;
  userLogin: string;
  objectId: number;
  objectName: string;
  workTypeId: number;
  workTypeName: string;
  workTypeType: string;
  workTypeSubtype: string;
  workDate: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;  
  totalPrice: number; 
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}





export interface User {
  id: number;
  login: string;
  fullName?: string;
  role: 'Admin' | 'Worker';
  createdAt?: string;
}
