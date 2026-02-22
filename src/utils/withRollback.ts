import { deleteFile } from "../storage/deleteFile";

export const withFilesRollback = async <T>(files: string[], fn: () => Promise<T>): Promise<T> => {
  return fn().catch(async (error) => {
    if (files.length) await deleteFile(files);

    throw error;
  });
};
