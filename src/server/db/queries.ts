import { db } from "~/server/db";
import { files_table, folders_table } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function getAllParentsForFolder(folderId: number) {
  const parents = [];
  let currentFolderId: number | null = folderId;

  while (currentFolderId !== null) {
    const folder = await db
      .selectDistinct()
      .from(folders_table)
      .where(eq(folders_table.id, currentFolderId));

    if (!folder[0]) throw new Error("Parent folder not found");
    parents.push(folder[0]);
    currentFolderId = folder[0]?.parent;
  }

  return parents.reverse();
}

export async function getFiles(folderId: number) {
  return db.select().from(files_table).where(eq(files_table.parent, folderId));
}
export async function getFolders(folderId: number) {
  return db
    .select()
    .from(folders_table)
    .where(eq(folders_table.parent, folderId));
}
