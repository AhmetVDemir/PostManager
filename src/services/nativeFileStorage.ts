/**
 * Capacitor native file storage adapter.
 *
 * Android scoped storage (10+) rules:
 *   - Directory.ExternalStorage: legacy, requires MANAGE_EXTERNAL_STORAGE
 *     on Android 11+ — flaky in practice
 *   - Directory.External: app's own external dir, no permission needed,
 *     always works, accessible via FileProvider for sharing
 *
 * Flow:
 *   1. Write PNG/JPG to app's external dir (sandbox, no permissions)
 *   2. Open native Share sheet with the file URI
 *   3. User picks "Galeriye Kaydet" / Instagram / WhatsApp / etc.
 *
 * The share sheet on Android 10+ already exposes a "Save to gallery"
 * action that copies the file into Pictures/. No manual MediaStore
 * write needed.
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
  readonly destinationName = 'Paylaşım menüsü'

  // Native platform doesn't need user to "choose" a folder up-front —
  // Android share sheet handles the destination.
  async chooseDestination(): Promise<boolean> {
    return true
  }

  async resetDestination(): Promise<void> {
    /* no-op on native */
  }

  async save(filename: string, blob: Blob): Promise<SaveResult> {
    const base64 = await blobToBase64(blob)

    // Step 1: write to app's own external dir. Works on every Android
    // version, no permission needed. Path: /storage/emulated/0/Android/
    //   data/academy.muhyi.postmanager/files/<filename>
    let uri: string
    try {
      const res = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.External,
      })
      uri = res.uri
      console.info('[nativeFileStorage] wrote', uri)
    } catch (e) {
      // Fallback to app's private data dir (always writeable) if even
      // External fails for some reason
      try {
        const res = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Data,
        })
        uri = res.uri
        console.info('[nativeFileStorage] fallback Data wrote', uri)
      } catch (e2) {
        const msg = e2 instanceof Error ? e2.message : String(e2)
        return { ok: false, reason: `Dosya yazılamadı: ${msg}` }
      }
    }

    // Step 2: open Android share sheet so the user can:
    //   - Save to Gallery (Photos / Galeri app's "Save" action)
    //   - Share to Instagram / WhatsApp / Telegram / Mail / ...
    try {
      await Share.share({
        title: 'PostManager',
        text: 'Yeni post',
        url: uri,
        dialogTitle: 'Paylaş veya kaydet',
      })
    } catch (e) {
      // User cancelled the share dialog or no share-capable app is
      // available. File is still saved — return success with a hint.
      console.warn('[nativeFileStorage] share dialog dismissed:', e)
      return {
        ok: true,
        location: uri,
        reason: 'paylaşım menüsü kapatıldı (dosya kaydedildi)',
      }
    }

    return { ok: true, location: uri }
  }
}

export const nativeFileStorage = new NativeFileStorage()
