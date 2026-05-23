/**
 * Platform-agnostic file storage interface.
 *
 * Bu modül Web (File System Access API + indirme fallback) için bir
 * implementation sağlar. İleride Capacitor / Tauri / Electron eklenirse,
 * bu interface ile aynı imzayı koruyarak native bir implementation
 * yazılabilir — uygulamanın geri kalanı değişmez.
 *
 * Capacitor örneği (ileride):
 *   if (Capacitor.isNativePlatform()) return new NativeFileStorage()
 *   return new WebFileStorage()
 */

export interface SaveResult {
  ok: boolean
  reason?: string
  location?: string
}

export interface FileStorage {
  /** This platform can persistently save to a user-chosen folder. */
  readonly supported: boolean
  /** Whether a destination is currently set. */
  readonly hasDestination: boolean
  /** Human-readable destination label (folder name on web, path on native). */
  readonly destinationName: string
  /** Open a picker so the user can choose where to save. */
  chooseDestination: () => Promise<boolean>
  /** Forget the chosen destination. */
  resetDestination: () => Promise<void>
  /** Save a blob with the given filename. */
  save: (filename: string, blob: Blob) => Promise<SaveResult>
}

/** Trigger a browser download as a fallback when no destination is set. */
export async function browserDownload(filename: string, blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
