import { computed, reactive } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const loadStaticContentFallback = async (language: 'es' | 'en' = 'es'): Promise<Partial<CompanySettings> | null> => {
  try {
    const contentFile = language === 'en' ? '/data/content_en.json' : '/data/content.json'
    const response = await fetch(contentFile)
    if (!response.ok) {
      return null
    }

    const payload = await response.json()
    const footerSocials = Array.isArray(payload?.footer?.social) ? payload.footer.social : []
    const socialLinks: Record<string, string> = {}

    for (const entry of footerSocials as Array<{ name?: string; url?: string }>) {
      if (entry?.name && entry?.url) {
        socialLinks[entry.name.toLowerCase()] = entry.url
      }
    }

    return {
      restaurantName: payload?.brand?.companyName || payload?.contact?.companyName || defaultCompanySettings.restaurantName,
      address: payload?.brand?.location || payload?.contact?.address || defaultCompanySettings.address,
      phone: payload?.contact?.telephone || defaultCompanySettings.phone,
      email: payload?.contact?.email || defaultCompanySettings.email,
      openingHours: payload?.contact?.hours || defaultCompanySettings.openingHours,
      socials: {
        tiktok: socialLinks.tiktok || defaultCompanySettings.socials.tiktok,
        whatsapp: socialLinks.whatsapp || defaultCompanySettings.socials.whatsapp,
        instagram: socialLinks.instagram || defaultCompanySettings.socials.instagram,
        facebook: socialLinks.facebook || defaultCompanySettings.socials.facebook,
        googleReviews: payload?.contact?.reviewUrl || defaultCompanySettings.socials.googleReviews,
        uberEats: socialLinks.ubereats || defaultCompanySettings.socials.uberEats,
        justEat: socialLinks.justeat || defaultCompanySettings.socials.justEat,
        glovo: socialLinks.glovo || defaultCompanySettings.socials.glovo,
      },
      logoImage: payload?.brand?.logoImage || defaultCompanySettings.logoImage,
      bannerImage: payload?.brand?.heroImage || defaultCompanySettings.bannerImage,
    }
  } catch (error) {
    console.warn('No se pudo cargar la configuración estática desde /data/content.json.', error)
    return null
  }
}

export type CompanySocialLinks = {
  tiktok?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  youtube?: string
  googleReviews?: string
  uberEats?: string
  justEat?: string
  glovo?: string
}

export type CompanySettings = {
  restaurantName: string
  legalName: string
  taxId: string
  address: string
  fiscalAddress: string
  postalCode: string
  city: string
  country: string
  phone: string
  email: string
  openingHours: string
  socials: CompanySocialLinks
  logoImage?: string
  bannerImage?: string
  taxRate: number
  sessionTTLMinutes: number
  defaultCurrency: string
  updatedAt: string
}

export const defaultCompanySettings: CompanySettings = {
  restaurantName: 'Mi Restaurante',
  legalName: 'Mi Restaurante S.L.',
  taxId: '',
  address: 'Calle Mayor 123, Madrid',
  fiscalAddress: 'Calle Mayor 123',
  postalCode: '28001',
  city: 'Madrid',
  country: 'España',
  phone: '+34 600 000 000',
  email: 'hola@mi-restaurante.com',
  openingHours: 'Lunes a Domingo · 12:00 - 00:00',
  socials: {
    tiktok: 'https://www.tiktok.com/@mi-restaurante',
    whatsapp: 'https://wa.me/34600000000',
    instagram: 'https://www.instagram.com/mi-restaurante',
    facebook: 'https://www.facebook.com/mi-restaurante',
    youtube: 'https://www.youtube.com/@mi-restaurante',
    googleReviews: 'https://maps.google.com/?q=mi+restaurante',
    uberEats: '',
    justEat: '',
    glovo: '',
  },
  logoImage: '',
  bannerImage: '',
  taxRate: 0.1,
  sessionTTLMinutes: 180,
  defaultCurrency: 'EUR',
  updatedAt: new Date().toISOString(),
}

const state = reactive({
  settings: { ...defaultCompanySettings, socials: { ...defaultCompanySettings.socials } },
  loading: false,
})

const normalizeSettings = (payload: Partial<CompanySettings> | null | undefined): CompanySettings => {
  const merged = {
    ...defaultCompanySettings,
    ...payload,
    socials: {
      ...defaultCompanySettings.socials,
      ...(payload?.socials ?? {}),
    },
  }

  return {
    ...merged,
    updatedAt: merged.updatedAt || new Date().toISOString(),
  }
}

export function useCompanySettings() {
  const settings = computed(() => state.settings)

  const loadSettings = async (language: 'es' | 'en' = 'es') => {
    state.loading = true

    try {
      let resolved = null as any

      if (db) {
        const candidates = ['restaurant', 'company', 'settings']

        for (const docId of candidates) {
          const ref = doc(db, 'settings', docId)
          const snapshot = await getDoc(ref)
          if (snapshot.exists()) {
            resolved = snapshot.data()
            break
          }
        }

        if (!resolved) {
          const fallback = doc(db, 'settings', 'restaurant')
          const snapshot = await getDoc(fallback)
          if (snapshot.exists()) {
            resolved = snapshot.data()
          }
        }
      }

      if (resolved) {
        state.settings = normalizeSettings(resolved)
        return state.settings
      }

      const staticFallback = await loadStaticContentFallback(language)
      if (staticFallback) {
        state.settings = normalizeSettings(staticFallback)
        return state.settings
      }

      state.settings = normalizeSettings(defaultCompanySettings)
      return state.settings
    } catch (error) {
      console.warn('No se pudo cargar la configuración del restaurante desde Firestore ni desde los datos estáticos.', error)
      state.settings = normalizeSettings(defaultCompanySettings)
      return state.settings
    } finally {
      state.loading = false
    }
  }

  const saveSettings = async (nextSettings: Partial<CompanySettings>) => {
    if (!db) {
      state.settings = normalizeSettings(nextSettings)
      return state.settings
    }

    const payload = normalizeSettings(nextSettings)

    try {
      await setDoc(doc(db, 'settings', 'restaurant'), payload, { merge: true })
      state.settings = payload
      return payload
    } catch (error) {
      console.error('No se pudo guardar la configuración del restaurante.', error)
      throw error
    }
  }

  return {
    settings,
    loading: computed(() => state.loading),
    loadSettings,
    saveSettings,
  }
}
