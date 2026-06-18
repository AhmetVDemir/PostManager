/**
 * Capacitor native file storage adapter.
 *
 * Android'de:
 *   - PNG/JPG'yi Pictures klasörüne yazar (DCIM/PostManager/)
 *   - Sonra @capacitor/share ile native share intent açar →
 *     kullanıcı Instagram, WhatsApp, Galeri'ye direkt paylaşır
 *
 * Web build'inde bu modül çağrılmaz (isNative() guard) — bu yüzden
 * Capacitor plugin import'ları sadece native runtime'da çalışır.
 */

import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { FileStorage, SaveResult } from './fileStorage'

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // strip data:...;base64, prefix
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

class NativeFileStorage implements FileStorage {
  readonly supported = true
  readonly hasDestination = true
  readonly destinationName = 'Galeri / Pictures'

  // Native platform doesn't need user to "choose" a folder up-front —
  // Android scoped storage handles it. We default to public Pictures.
  async chooseDestination(): Promise<boolean> {
    return true
  }

  async resetDestination(): Promise<void> {
    /* no-op on native */
  }

  async save(filename: string, blob: Blob): Promise<SaveResult> {
    try {
      const base64 = await blobToBase64(blob)
      // Write under app's external Documents → Pictures/PostManager
      // Directory.ExternalStorage maps to /storage/emulated/0/ on Android
      const result = await Filesystem.writeFile({
        path: `Pictures/PostManager/${filename}`,
        data: base64,
        directory: Directory.ExternalStorage,
        recursive: true,
      })
      // Offer native share sheet so user can post directly to Instagram, etc.
      try {
        await Share.share({
          title: 'PostManager',
          text: 'Yeni post',
          url: result.uri,
          dialogTitle: 'Paylaş',
        })
      } catch {
        // Share dialog cancelled — file is still saved, that's fine
      }
      return { ok: true, location: result.uri }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, reason: msg }
    }
  }
}

export const nativeFileStorage = new NativeFileStorage()
