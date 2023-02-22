import { Request } from "express";

export interface MyApiRequest extends Request {
  pagination: pagination;
  resourceId: number;
  user: import("./resources").User | null;
}

export interface AuthenticatedRequest extends MyApiRequest {
  user: import("./resources").User;

}
export interface pagination {
  offset: number;
  limit: number;
}
