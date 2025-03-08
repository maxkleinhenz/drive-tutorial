import "server-only";

import { db } from "~/server/db";
import { files_table, folders_table } from "~/server/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export const QUERIES = {
  getAllParentsForFolder: async function (folderId: number) {
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
  },
  getFiles: async function (folderId: number) {
    return db
      .select()
      .from(files_table)
      .where(eq(files_table.parent, folderId))
      .orderBy(files_table.id);
  },
  getFolders: async function (folderId: number) {
    return db
      .select()
      .from(folders_table)
      .where(eq(folders_table.parent, folderId))
      .orderBy(folders_table.id);
  },
  getFolderById: async function (folderId: number) {
    const folder = await db
      .select()
      .from(folders_table)
      .where(eq(folders_table.id, folderId));

    return folder[0];
  },
  getRootFolderForUser: async function (userId: string) {
    const folder = await db
      .select()
      .from(folders_table)
      .where(
        and(eq(folders_table.ownerId, userId), isNull(folders_table.parent)),
      );
    return folder[0];
  },
};

export const MUTATIONS = {
  createFile: async function (input: {
    file: {
      name: string;
      size: number;
      url: string;
      parent: number;
    };
    userId: string;
  }) {
    return await db
      .insert(files_table)
      .values({ ...input.file, ownerId: input.userId });
  },
  onboardUser: async function (userId: string) {
    const rootFolder = await db
      .insert(folders_table)
      .values({
        name: "Root",
        parent: null,
        ownerId: userId,
      })
      .$returningId();

    const rootFolderId = rootFolder[0]!.id;

    await db.insert(folders_table).values([
      {
        name: "Trash",
        parent: rootFolderId,
        ownerId: userId,
      },
      {
        name: "Shared",
        parent: rootFolderId,
        ownerId: userId,
      },
      {
        name: "Documents",
        parent: rootFolderId,
        ownerId: userId,
      },
    ]);

    return rootFolderId;
  },
};
