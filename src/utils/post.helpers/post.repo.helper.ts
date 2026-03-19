import { getMonthKey } from "../date.converter";
import type { Post } from "../../validation/post.schema";

export function bulkHelper(docs: { data: Post }[]) {
  const removedImagesSet: string[] = []; // collect all images to delete (published or not)
  const archiveDeltas = new Map<string, number>(); // monthKey -> delta
  const categoryDeltas = new Map<string, number>(); // category -> delta

  for (const { data } of docs) {
    // collect all images to delete (published or not)
    (data.files as string[] | undefined)?.forEach((url) => {
      if (typeof url === "string" && url) removedImagesSet.push(url);
    });

    // counters only for published posts
    if (data.status !== "Published") continue;

    const monthKey = getMonthKey(data.createdAt);

    archiveDeltas.set(monthKey, (archiveDeltas.get(monthKey) ?? 0) - 1);

    const category = data.category;
    categoryDeltas.set(category, (categoryDeltas.get(category) ?? 0) - 1);
  }

  return { removedImagesSet, archiveDeltas, categoryDeltas };
}

export function resolvePostStateTransitions(oldData: Post, newData: Partial<Post>) {
  // Determine what changed in category and status to update counters
  const oldStatus = oldData.status;
  const newStatus = newData.status ?? oldStatus;
  const statusChanged = oldStatus !== newStatus;

  const oldCategory = oldData.category;
  const newCategory = newData.category ?? oldCategory;
  const categoryChanged = oldCategory !== newCategory;

  // Determine what changed in category and status
  const becamePublished = statusChanged && newStatus === "Published";
  const becameDraft = statusChanged && newStatus !== "Published"; // leaving Published
  const movedWhilePublished = !statusChanged && categoryChanged && newStatus === "Published";

  return {
    oldStatus,
    newStatus,
    statusChanged,
    oldCategory,
    newCategory,
    categoryChanged,
    becamePublished,
    becameDraft,
    movedWhilePublished,
  };
}
