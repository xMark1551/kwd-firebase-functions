import { PaginatedResult } from "./repositories/base.repository";

declare global {
  type Pagination<T> = {
    page?: number;
    pageSize?: number;
    filters?: T;
  };

  // types.ts
  export interface ActivityLog {
    id: string;
    level: "info" | "warning" | "error";
    action: string; // 'post_created', 'post_updated', 'post_deleted'
    message: string;
    userId?: string;
    userName?: string;
    metadata?: {
      postId?: string;
      category?: string;
      oldValue?: any;
      newValue?: any;
      [key: string]: any;
    };
    timestamp: FirebaseFirestore.Timestamp;
    createdAt: FirebaseFirestore.FieldValue;
  }

  type PaginatedResultWithCount<T> = PaginatedResult<T>;
}

export {};
