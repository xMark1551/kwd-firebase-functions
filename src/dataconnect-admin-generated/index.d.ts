import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface AddMovieToListData {
  listMovie_insert: ListMovie_Key;
}

export interface AddMovieToListVariables {
  listId: UUIDString;
  movieId: UUIDString;
  note?: string | null;
  position: number;
}

export interface AddReviewData {
  review_insert: Review_Key;
}

export interface AddReviewVariables {
  movieId: UUIDString;
  watchId: UUIDString;
  rating: number;
  review?: string | null;
}

export interface CreateNewListData {
  list_insert: List_Key;
}

export interface CreateNewListVariables {
  name: string;
  description?: string | null;
  public: boolean;
}

export interface GetMoviesInListData {
  list?: {
    movies_via_ListMovie: ({
      id: UUIDString;
      title: string;
      year: number;
      genres?: string[] | null;
    } & Movie_Key)[];
  };
}

export interface GetMoviesInListVariables {
  listId: UUIDString;
}

export interface ListMovie_Key {
  listId: UUIDString;
  movieId: UUIDString;
  __typename?: 'ListMovie_Key';
}

export interface List_Key {
  id: UUIDString;
  __typename?: 'List_Key';
}

export interface Movie_Key {
  id: UUIDString;
  __typename?: 'Movie_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Watch_Key {
  id: UUIDString;
  __typename?: 'Watch_Key';
}

/** Generated Node Admin SDK operation action function for the 'AddMovieToList' Mutation. Allow users to execute without passing in DataConnect. */
export function addMovieToList(dc: DataConnect, vars: AddMovieToListVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddMovieToListData>>;
/** Generated Node Admin SDK operation action function for the 'AddMovieToList' Mutation. Allow users to pass in custom DataConnect instances. */
export function addMovieToList(vars: AddMovieToListVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddMovieToListData>>;

/** Generated Node Admin SDK operation action function for the 'GetMoviesInList' Query. Allow users to execute without passing in DataConnect. */
export function getMoviesInList(dc: DataConnect, vars: GetMoviesInListVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMoviesInListData>>;
/** Generated Node Admin SDK operation action function for the 'GetMoviesInList' Query. Allow users to pass in custom DataConnect instances. */
export function getMoviesInList(vars: GetMoviesInListVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMoviesInListData>>;

/** Generated Node Admin SDK operation action function for the 'CreateNewList' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewList(dc: DataConnect, vars: CreateNewListVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewListData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewList' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewList(vars: CreateNewListVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewListData>>;

/** Generated Node Admin SDK operation action function for the 'AddReview' Mutation. Allow users to execute without passing in DataConnect. */
export function addReview(dc: DataConnect, vars: AddReviewVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddReviewData>>;
/** Generated Node Admin SDK operation action function for the 'AddReview' Mutation. Allow users to pass in custom DataConnect instances. */
export function addReview(vars: AddReviewVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddReviewData>>;

