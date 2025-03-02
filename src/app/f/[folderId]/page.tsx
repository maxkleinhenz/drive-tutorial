import { db } from "~/server/db";
import { files_table, folders_table } from "~/server/db/schema";
import DriveContents from "../../drive-contents";
import { z } from "zod";
import { eq } from "drizzle-orm";

export default async function GoogleDriveClone(props: {
  params: Promise<{ folderId: string }>;
}) {
  const params = await props.params;

  const parsedFolderId = parseInt(params.folderId);
  if (isNaN(parsedFolderId)) {
    return <div>Invalid folder ID</div>;
  }

  console.log(params.folderId);
  const files = await db
    .select()
    .from(files_table)
    .where(eq(files_table.parent, parsedFolderId));
  const folders = await db
    .select()
    .from(folders_table)
    .where(eq(folders_table.parent, parsedFolderId));
  return <DriveContents files={files} folders={folders} />;
}
