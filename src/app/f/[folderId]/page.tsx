import { db } from "~/server/db";
import { files_table, folders_table } from "~/server/db/schema";
import DriveContents from "../../drive-contents";
import { eq } from "drizzle-orm";

async function getAllParents(folderId: number) {
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

export default async function GoogleDriveClone(props: {
  params: Promise<{ folderId: string }>;
}) {
  const params = await props.params;

  const parsedFolderId = parseInt(params.folderId);
  if (isNaN(parsedFolderId)) {
    return <div>Invalid folder ID</div>;
  }

  const filesPromise = db
    .select()
    .from(files_table)
    .where(eq(files_table.parent, parsedFolderId));
  const foldersPromise = db
    .select()
    .from(folders_table)
    .where(eq(folders_table.parent, parsedFolderId));
  const parentsPromise = getAllParents(parsedFolderId);

  const [files, folders, parents] = await Promise.all([
    filesPromise,
    foldersPromise,
    parentsPromise,
  ]);
  return <DriveContents files={files} folders={folders} parents={parents} />;
}
