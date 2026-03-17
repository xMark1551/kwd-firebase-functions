import { AsyncLocalStorage } from "async_hooks";

export type User = {
  uid: string;
  admin: boolean;
  email: string;
};

export type RequestContext = {
  requestId: string;
  user: User | null;
  method: string;
  path: string;
  ip: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getContext = () => requestContext.getStore();
