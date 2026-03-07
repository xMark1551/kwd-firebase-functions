import { deleteFile } from "../storage/deleteFile";

export const withFilesRollback = async <T>(urls: string[] | string, fn: () => Promise<T>): Promise<T> => {
  return fn().catch(async (error) => {
    if (!urls) return fn();

    // if urls is a string, convert it to an array
    if (typeof urls === "string") urls = [urls];
    if (urls.length) await deleteFile(urls);

    throw error;
  });
};
