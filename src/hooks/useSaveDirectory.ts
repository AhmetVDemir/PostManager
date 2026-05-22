import { useCallback, useEffect, useState } from 'react'

type DirHandle = FileSystemDirectoryHandle | null

const DB_NAME = 'postmanager'
const STORE_NAME = 'handles'
const KEY = 'saveDir'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadHandle(): Promise<DirHandle> {
  try {
    const db = await openDB()
    return await new Promise<DirHandle>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(KEY)
      req.onsuccess = () => resolve((req.result as DirHandle) ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function persistHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function clearHandle(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    /* ignore */
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export function useSaveDirectory() {
  const [handle, setHandle] = useState<DirHandle>(null)
  const [name, setName] = useState<string>('')

  useEffect(() => {
    loadHandle().then((h) => {
      if (h) {
        setHandle(h)
        setName(h.name)
      }
    })
  }, [])

  const pickDirectory = useCallback(async (): Promise<DirHandle> => {
    if (!isFileSystemAccessSupported()) return null
    try {
      // @ts-expect-error showDirectoryPicker not in lib.dom yet on all TS versions
      const h: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      await persistHandle(h)
      setHandle(h)
      setName(h.name)
      return h
    } catch {
      return null
    }
  }, [])

  const verifyPermission = useCallback(async (h: FileSystemDirectoryHandle): Promise<boolean> => {
    const anyHandle = h as unknown as {
      queryPermission: (opts: { mode: string }) => Promise<PermissionState>
      requestPermission: (opts: { mode: string }) => Promise<PermissionState>
    }
    const q = await anyHandle.queryPermission({ mode: 'readwrite' })
    if (q === 'granted') return true
    const r = await anyHandle.requestPermission({ mode: 'readwrite' })
    return r === 'granted'
  }, [])

  const writeFile = useCallback(
    async (filename: string, blob: Blob): Promise<{ ok: boolean; reason?: string }> => {
      if (!handle) return { ok: false, reason: 'no-handle' }
      const ok = await verifyPermission(handle)
      if (!ok) return { ok: false, reason: 'permission-denied' }
      try {
        const fileHandle = await handle.getFileHandle(filename, { create: true })
        const anyFH = fileHandle as unknown as {
          createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }>
        }
        const writable = await anyFH.createWritable()
        await writable.write(blob)
        await writable.close()
        return { ok: true }
      } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : 'write-failed' }
      }
    },
    [handle, verifyPermission],
  )

  const reset = useCallback(async () => {
    await clearHandle()
    setHandle(null)
    setName('')
  }, [])

  return {
    supported: isFileSystemAccessSupported(),
    handle,
    name,
    pickDirectory,
    writeFile,
    reset,
  }
}
