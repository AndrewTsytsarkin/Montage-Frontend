import type { WorkTypeDto } from "..";

 

// Для группировки по типам и подтипам
export interface WorkTypeGroup {
  type: string;
  subtypes: {
    subtype: string;
    workTypes: WorkTypeDto[];
  }[];
}