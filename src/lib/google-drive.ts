import { google } from "googleapis"

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: "v3", auth })
}

export async function listFolders(accessToken: string, parentId?: string) {
  const drive = getDriveClient(accessToken)
  const query = parentId
    ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : "mimeType='application/vnd.google-apps.folder' and trashed=false"

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name, mimeType, parents, webViewLink, createdTime)",
    orderBy: "folder,name_natural",
    pageSize: 200,
  })

  return res.data.files || []
}

export async function listFiles(accessToken: string, folderId: string) {
  const drive = getDriveClient(accessToken)
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime, iconLink, thumbnailLink)",
    orderBy: "name_natural",
    pageSize: 200,
  })

  return res.data.files || []
}

export async function searchFiles(accessToken: string, query: string) {
  const drive = getDriveClient(accessToken)
  const res = await drive.files.list({
    q: `name contains '${query.replace(/'/g, "\\'")}' and trashed=false`,
    fields: "files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime, iconLink)",
    orderBy: "name_natural",
    pageSize: 50,
  })

  return res.data.files || []
}

export async function uploadFile(
  accessToken: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer | string,
  parentId?: string
) {
  const drive = getDriveClient(accessToken)
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: parentId ? [parentId] : undefined,
    },
    media: {
      mimeType,
      body: fileBuffer,
    },
    fields: "id, name, mimeType, size, webViewLink, webContentLink",
  })

  return res.data
}

export async function getFileInfo(accessToken: string, fileId: string) {
  const drive = getDriveClient(accessToken)
  const res = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size, webViewLink, webContentLink, iconLink, thumbnailLink, createdTime, modifiedTime",
  })

  return res.data
}

export async function getRootFolders(accessToken: string) {
  const drive = getDriveClient(accessToken)
  const res = await drive.files.list({
    q: "'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: "files(id, name, mimeType, parents, webViewLink, createdTime)",
    orderBy: "folder,name_natural",
    pageSize: 200,
  })

  return res.data.files || []
}

export async function getBreadcrumbPath(accessToken: string, folderId: string) {
  const drive = getDriveClient(accessToken)
  const path: { id: string; name: string }[] = []

  let currentId = folderId
  let maxDepth = 20

  while (currentId && maxDepth > 0) {
    try {
      const res = await drive.files.get({
        fileId: currentId,
        fields: "id, name, parents",
      })

      path.unshift({ id: res.data.id!, name: res.data.name! })

      if (res.data.parents && res.data.parents.length > 0) {
        currentId = res.data.parents[0]
      } else {
        break
      }
    } catch {
      break
    }
    maxDepth--
  }

  return path
}
