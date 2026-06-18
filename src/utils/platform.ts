/**
 * Platform detection — web vs native Capacitor (Android / iOS).
 *
 * Tek nokta: tüm runtime kararları (API URL, dosya kaydı, paylaşım)
 * bu helper'lardan platform öğrenir. Frontend kodunda Capacitor
 * import'u dağıtmaya gerek yok.
 *
 * @capacitor/core ister web ister native build'de güvenle import
 * edilebilir — web'de `isNativePlatform()` her zaman false döner.
 */

import { Capacitor } from '@capacitor/core'

/** True only when running inside a native Capacitor WebView (Android/iOS). */
export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/** Returns 'web' | 'android' | 'ios'. */
export function getPlatform(): 'web' | 'android' | 'ios' {
  try {
    const p = Capacitor.getPlatform()
    if (p === 'android' || p === 'ios') return p
    return 'web'
  } catch {
    return 'web'
  }
}

/**
 * API endpoint base URL.
 * - Web: '' → relative URL, same-origin (Cloudflare Pages)
 * - Native: absolute URL pointing to deployed Pages domain
 *
 * Cloudflare Function CORS configured with Access-Control-Allow-Origin: *
 * so cross-origin from a native WebView works.
 */
const PRODUCTION_API = 'https://app.postmanager.muhyi.academy'

export function getApiBase(): string {
  return isNative() ? PRODUCTION_API : ''
}
