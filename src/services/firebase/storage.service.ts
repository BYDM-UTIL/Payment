import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'
import { validateFile } from '@/utils/validation'
import { isoNow } from '@/utils/dates'
import type { Attachment } from '@/types'

export async function uploadFile(
  path: string,
  file: File,
  uploadedBy: string
): Promise<Attachment> {
  const error = validateFile(file)
  if (error) throw new Error(error)

  const fileRef = ref(storage, `${path}/${Date.now()}_${file.name}`)
  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)

  return {
    id: fileRef.name,
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    uploadedAt: isoNow(),
    uploadedBy,
  }
}

export async function uploadSignature(
  employeeId: string,
  year: number,
  month: number,
  dataUrl: string
): Promise<string> {
  const blob = dataURLToBlob(dataUrl)
  const fileRef = ref(storage, `signatures/${employeeId}/${year}/${month}/signature.png`)
  await uploadBytes(fileRef, blob)
  return getDownloadURL(fileRef)
}

export async function deleteFile(url: string) {
  const fileRef = ref(storage, url)
  await deleteObject(fileRef)
}

function dataURLToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}
