import { Timestamp } from "firebase-admin/firestore";
import { CreatePost } from "../validation/post.schema";

export type Post = {
  id: string;
  authorId: string;
  title: string;
  description: string;
  category: "news" | "updates" | "events" | "repair" | "announcement" | "gender-and-development";
  status: "Published" | "Draft";
  files: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isFeatured: boolean;
};

export interface CreatePostRecord extends CreatePost {
  authorId: string;
}

export interface GetPaginatedPost {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  year?: number;
  month?: number;
}

export interface GetCountArgs extends Omit<GetPaginatedPost, "page" | "pageSize"> {
  category?: string;
  status?: string;
  year?: number;
  month?: number;
}

export interface PostArchiveCountByhMonth {
  month: string;
  totalPosts: number;
}

export interface PostCategoryCount {
  category: string;
  totalPosts: number;
}
