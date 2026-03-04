 

 
export interface CreateUserDto {
  login: string;
  password: string;
  fullName?: string;
  role: 'Admin' | 'Worker';
}

export interface UpdateUserDto {
  fullName?: string;
  role?: 'Admin' | 'Worker';
  password?: string;
}

export interface AdminStats {
  totalUsers: number;
  adminCount: number;
  workerCount: number;
  totalWorks: number;
  totalObjects: number;
}
export interface CreateWorkReportDto {
  objectId: number;
  workTypeId: number;
  workDate: string;
  quantity: number;
  comment?: string;
}

export interface UpdateWorkReportDto {
  quantity?: number;
  comment?: string;
}

export interface WorkTypeDto {
  id: number;
  type: string;
  subtype: string;
  name: string;
  unit: string;
  pricePerUnit: number;  
}

// Для группировки по типам и подтипам
export interface WorkTypeGroup {
  type: string;
  subtypes: {
    subtype: string;
    workTypes: WorkTypeDto[];
  }[];
}