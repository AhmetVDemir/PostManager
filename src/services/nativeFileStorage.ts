/**
 * Capacitor native file storage adapter.
 *
 * Provides TWO separate actions, exposed to the editor as two buttons:
 *   - saveToGallery(): writes the image directly into the system gallery
 *     (Pictures/PostManager album) via MediaStore API. Permission handled
 *     by @capacitor-community/media plugin at runtime.
 *   - shareFile(): writes to the app's external sandbox and opens the
 *     native share sheet (Instagram, WhatsApp, Telegram, Mail, ...).
 *
 * Android 10+ scoped-storage friendly: MediaStore for gallery saves, and
 * Directory.External for the share path — neither needs MANAGE_EXTERNAL_
 * STORAGE.
 */

import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Media } from '@capacitor-community/media'
import type { FileStorage, SaveResult } from './fileStorage'

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
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
  readonly destinationName = 'Galeri / Paylaşım'

  async chooseDestination(): Promise<boolean> {
    return true
  }

  async resetDestination(): Promise<void> {
    /* no-op on native */
  }

  /**
   * Default save() routes to gallery. Kept so we still satisfy the
   * FileStorage interface that web ExportStep code uses.
   */
  async save(filename: string, blob: Blob): Promise<SaveResult> {
    return this.saveToGallery(filename, blob)
  }

  /**
   * Save directly to the system gallery (Pictures/PostManager).
   * Uses MediaStore API under the hood, so the photo shows up in
   * Galeri / Google Photos / Samsung Gallery without a manual scan.
   *
   * v9 of @capacitor-community/media requires an albumIdentifier. We
   * look up or create the "PostManager" album first, then save into it.
   */
  async saveToGallery(filename: string, blob: Blob): Promise<SaveResult> {
    try {
      const base64 = await blobToBase64(blob)
      const mime = blob.type || 'image/png'
      const dataUrl = `data:${mime};base64,${base64}`
      console.info('[nativeFileStorage] saveToGallery →', filename)

      const albumIdentifier = await this.ensurePostManagerAlbum()
      console.info('[nativeFileStorage] using albumIdentifier:', albumIdentifier)

      const result = await Media.savePhoto({
        path: dataUrl,
        albumIdentifier,
      })
      console.info('[nativeFileStorage] saved to gallery', result, 'as', filename)
      return { ok: true, location: 'Galeri › PostManager' }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[nativeFileStorage] saveToGallery failed:', msg)
      return { ok: false, reason: msg }
    }
  }

  /** Find the "PostManager" album by name, creating it if missing.
   *  Returns its identifier (required by Media.savePhoto in v9). */
  private async ensurePostManagerAlbum(): Promise<string> {
    const name = 'PostManager'

    const findAlbum = async (): Promise<string | null> => {
      try {
        const { albums } = await Media.getAlbums()
        const match = albums.find((a) => a.name === name)
        return match?.identifier ?? null
      } catch (e) {
        console.warn('[nativeFileStorage] getAlbums failed:', e)
        return null
      }
    }

    let id = await findAlbum()
    if (id) return id

    // Album not present — create it, then look up again
    try {
      await Media.createAlbum({ name })
    } catch (e) {
      // Already exists / race: still try to find it
      console.warn('[nativeFileStorage] createAlbum issued warning:', e)
    }
    id = await findAlbum()
    if (id) return id

    throw new Error(
      'PostManager albümü bulunamadı/oluşturulamadı. Telefonun fotoğraf erişim iznini kontrol et.',
    )
  }

  /**
   * Write to app sandbox + open native share sheet so the user can
   * post directly to Instagram / WhatsApp / etc.
   */
  async shareFile(filename: string, blob: Blob): Promise<SaveResult> {
    const base64 = await blobToBase64(blob)
    let uri: string
    try {
      const res = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.External,
      })
      uri = res.uri
    } catch (e) {
      try {
        const res = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Data,
        })
        uri = res.uri
      } catch (e2) {
        const msg = e2 instanceof Error ? e2.message : String(e2)
        return { ok: false, reason: `Dosya yazılamadı: ${msg}` }
      }
    }

    try {
      await Share.share({
        title: 'PostManager',
        text: 'Yeni post',
        url: uri,
        dialogTitle: 'Paylaş',
      })
      return { ok: true, location: uri }
    } catch (e) {
      console.warn('[nativeFileStorage] share dismissed:', e)
      return {
        ok: true,
        location: uri,
        reason: 'paylaşım menüsü kapatıldı (dosya app klasörüne kaydedildi)',
      }
    }
  }
}

export const nativeFileStorage = new NativeFileStorage()
