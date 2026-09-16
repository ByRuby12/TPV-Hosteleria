<template>
  <div class="page client-shell">
    <header class="header-container">
      <div class="hero-banner" :style="heroBannerStyle">
        <div class="hero-overlay"></div>

        <div class="hero-top">
          <img
            v-if="settings.logoImage"
            class="logo logo-image"
            :src="normalizeProductImage(settings.logoImage)"
            :alt="restaurantName"
          />
          <div v-else class="logo" aria-label="Logo del restaurante">{{ restaurantInitials }}</div>
          <div class="location-block">
            <div class="company-name">{{ restaurantName }}</div>
            <div class="location">{{ settings.address }}</div>
          </div>
        </div>

        <div class="header-actions">
          <div class="controls-stack">
            <button class="theme-toggle" @click="toggleTheme" aria-label="Cambiar tema">
              <i :class="darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" aria-hidden="true"></i>
            </button>

            <button class="lang-toggle" @click="toggleLanguage" aria-label="Cambiar idioma">
              <i class="fa-solid fa-globe" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      <nav class="category-nav">
        <button
          v-for="category in visibleCategories"
          :key="category.id"
          :data-category="category.id"
          :class="{
            active: selectedCategory === category.id,
            'cat-btn': true,
            'home-btn': category.id === 'contact'
          }"
          @click="selectedCategory = category.id"
        >
          {{ category.name }}
        </button>
      </nav>
    </header>

    <main class="main-content">
      <section
        v-for="category in categories"
        :key="category.id"
        :id="category.id"
        :class="[
          'category-section',
          { 'hidden-section': selectedCategory !== category.id },
          { 'fade-in': selectedCategory === category.id }
        ]"
      >
        <div class="product-grid">
          <article v-for="product in productsByCategory(category.id)" :key="product.id" class="product-card">
            <div
              class="product-image"
              :class="{ 'product-image-placeholder': !product.image }"
              :style="productImageStyle(product)"
              @click="product.image ? openProductImage(product) : undefined"
            ></div>

            <div class="product-info">
              <div class="product-header">
                <h3 class="product-title">{{ product.name }}</h3>
                <span class="product-price">{{ formatPrice(product.price) }}</span>
              </div>

              <div v-if="isProductOutOfStock(product)" class="stock-badge out">Agotado</div>
              <div v-else-if="isProductLowStock(product)" class="stock-badge low">Queda poco stock</div>

              <p class="product-desc">{{ product.description || 'Producto de la carta.' }}</p>

              <div class="product-footer">
                <div v-if="product.allergens?.length" class="allergens">
                  <span
                    v-for="allergen in product.allergens"
                    :key="`${product.id}-${allergen}`"
                    class="allergen-icon"
                    :title="`Alérgeno: ${allergen}`"
                  >
                    <img :src="getAllergenAsset(allergen)" :alt="allergen" />
                  </span>
                </div>
                <div class="product-actions">
                  <button
                    class="qty-btn qty-decrease"
                    :aria-label="`${currentLang === 'en' ? 'Remove one' : 'Quitar uno'} ${product.name}`"
                    @click="decrementFromCart(product)"
                  >
                    −
                  </button>

                  <span class="cart-quantity">
                    {{ getCartQuantity(product.id) }}
                  </span>

                  <button
                    class="qty-btn qty-increase"
                    :aria-label="`${currentLang === 'en' ? 'Add one' : 'Añadir uno'} ${product.name}`"
                    @click="addToCart(product)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        v-if="companyInfoReady"
        id="contacto"
        :class="[
          'category-section',
          { 'hidden-section': selectedCategory !== 'contact' },
          { 'fade-in': selectedCategory === 'contact' }
        ]"
      >
        <div class="contact-section">
          <div class="contact-card">
            <div class="contact-logo-block">
              <div class="contact-logo" aria-label="Logo del restaurante">
                <img
                  v-if="settings.logoImage"
                  :src="normalizeProductImage(settings.logoImage)"
                  :alt="restaurantName"
                />
                <span v-else>{{ restaurantInitials }}</span>
              </div>
              <div>
                <p class="section-label">{{ uiText.contactEyebrow }}</p>
                <h2>{{ uiText.contactTitle }}</h2>
              </div>
            </div>

            <div class="contact-info-grid">
              <div class="contact-info-card">
                <span class="contact-info-icon"><i class="fa-solid fa-location-dot" aria-hidden="true"></i></span>
                <div>
                  <strong>{{ uiText.addressLabel }}</strong>
                  <p>{{ settings.address }}</p>
                </div>
              </div>

              <div class="contact-info-card">
                <span class="contact-info-icon"><i class="fa-solid fa-phone" aria-hidden="true"></i></span>
                <div>
                  <strong>{{ uiText.phoneLabel }}</strong>
                  <p>{{ settings.phone }}</p>
                </div>
              </div>

              <div class="contact-info-card">
                <span class="contact-info-icon"><i class="fa-solid fa-clock" aria-hidden="true"></i></span>
                <div>
                  <strong>{{ uiText.hoursLabel }}</strong>
                  <p>{{ settings.openingHours }}</p>
                </div>
              </div>

              <div class="contact-info-card">
                <span class="contact-info-icon"><i class="fa-solid fa-envelope" aria-hidden="true"></i></span>
                <div>
                  <strong>{{ uiText.emailLabel }}</strong>
                  <p>{{ settings.email }}</p>
                </div>
              </div>
            </div>

            <div v-if="socialLinks.length" class="social-section">
              <p class="social-title">{{ uiText.followUs }}</p>
              <div class="social-links">
                <a
                  v-for="link in socialLinks"
                  :key="link.label"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="social-link"
                  :class="link.className"
                >
                  <i :class="link.iconClass" aria-hidden="true"></i>
                  {{ link.label }}
                </a>
              </div>
            </div>

            <div v-if="deliveryServices.length" class="social-section delivery-services-section">
              <p class="social-title">{{ uiText.deliveryServices }}</p>
              <div class="social-links delivery-services">
                <a
                  v-for="service in deliveryServices"
                  :key="service.label"
                  :href="service.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="social-link delivery-service-link"
                  :class="service.className"
                >
                  <span class="service-logo" aria-hidden="true">
                    <img :src="service.logo" :alt="`${service.label} logo`" />
                  </span>
                  <span class="service-name">{{ service.label }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="selectedProductImage" class="image-modal open" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal" aria-label="Cerrar imagen">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <img :src="selectedProductImage.src" :alt="selectedProductImage.alt" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { db } from '../../lib/firebase'
import { getCollectionSnapshot } from '../../services/firebase/firestore'
import { useCompanySettings } from '../../stores/companySettings'
import { useCart } from '../../stores/orderStore'
import { isProductLowStock, isProductOutOfStock } from '../../utils/productStock'

const { settings, loadSettings } = useCompanySettings()
const { addToCart, cart, decrementItem } = useCart()

const parsePrice = (value: string | number | undefined) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const match = value.match(/-?\d+(?:[.,]\d+)?/)
  if (!match) return 0

  const parsed = Number(match[0].replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'producto'

const normalizeProductImage = (value?: string) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const assetPath = value.replace(/^\.\//, '').replace(/^\//, '')
  const publicBase = import.meta.env.DEV ? '/' : import.meta.env.BASE_URL
  return `${publicBase}${assetPath}`
}

const productImageStyle = (product: any) => {
  if (!product?.image) return undefined

  return {
    backgroundImage: `url('${product.image}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

const getAllergenAsset = (allergen: string) => {
  const normalized = String(allergen).trim().toLowerCase()
  const allergenFileMap: Record<string, string> = {
    altramuces: 'altramuces',
    apio: 'apio',
    cacahuetes: 'cacahuetes',
    crustaceos: 'crustaceos',
    frutos: 'frutos',
    gluten: 'gluten',
    huevo: 'huevos',
    huevos: 'huevos',
    lactosa: 'lacteos',
    lacteos: 'lacteos',
    moluscos: 'moluscos',
    mostaza: 'mostaza',
    marisco: 'crustaceos',
    pescado: 'pescado',
    sesamo: 'sesamo',
    soja: 'soja',
    sulfitos: 'sulfitos',
  }

  const resolved = allergenFileMap[normalized] || normalized
  const publicBase = import.meta.env.DEV ? '/' : import.meta.env.BASE_URL
  return normalized ? `${publicBase}images/alergenos/${resolved}.png` : ''
}

const uiText = computed(() => ({
  contactEyebrow: currentLang.value === 'en' ? 'Our information' : 'Nuestra información',
  contactTitle: currentLang.value === 'en' ? 'Contact' : 'Contacto',
  addressLabel: currentLang.value === 'en' ? 'Address' : 'Dirección',
  phoneLabel: currentLang.value === 'en' ? 'Phone' : 'Teléfono',
  hoursLabel: currentLang.value === 'en' ? 'Hours' : 'Horario',
  emailLabel: currentLang.value === 'en' ? 'Email' : 'Email',
  followUs: currentLang.value === 'en' ? 'Follow us' : 'Síguenos',
  deliveryServices: currentLang.value === 'en' ? 'Order at home' : 'Servicios a domicilio',
  contactCategory: currentLang.value === 'en' ? 'Contact' : 'Contacto',
}))

const normalizeMenuCatalog = (payload: any) => {
  const categoriesFromPayload = Array.isArray(payload?.categories) ? payload.categories : []

  const categoriesMapped = categoriesFromPayload.map((category: any, index: number) => ({
    id: category?.identificador || category?.id || `category-${index + 1}`,
    name: category?.nombre || category?.name || `Categoría ${index + 1}`,
    active: true,
    order: index + 1,
  }))

  const productsMapped = categoriesFromPayload.flatMap((category: any, categoryIndex: number) => {
    const categoryId = category?.identificador || category?.id || `category-${categoryIndex + 1}`
    const rawProducts = Array.isArray(category?.productos) ? category.productos : []

    return rawProducts.map((product: any, productIndex: number) => ({
      id: product?.id || `${categoryId}-${slugify(product?.nombre || `producto-${productIndex + 1}`)}`,
      name: product?.nombre || product?.name || `Producto ${productIndex + 1}`,
      description: product?.descripcion || product?.description || '',
      price: parsePrice(product?.precio ?? product?.price),
      image: normalizeProductImage(product?.imagen || product?.image),
      categoryId,
      available: typeof product?.available === 'boolean' ? product.available : true,
      stock: Number(product?.stock ?? 100),
      lowStockThreshold: Number(product?.lowStockThreshold ?? 5),
      order: product?.order ?? productIndex + 1,
      allergens: Array.isArray(product?.alergenos) ? product.alergenos : Array.isArray(product?.allergens) ? product.allergens : [],
    }))
  })

  return {
    categories: categoriesMapped,
    products: productsMapped,
  }
}

const loadMenuFallback = async (language: 'es' | 'en' = currentLang.value) => {
  try {
    const menuFile = language === 'en' ? '/data/menu_en.json' : '/data/menu.json'
    const response = await fetch(menuFile)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    const fallbackCatalog = normalizeMenuCatalog(payload)

    categories.value = fallbackCatalog.categories
    products.value = fallbackCatalog.products

    return fallbackCatalog
  } catch (error) {
    console.warn(`No se pudo cargar la carta desde el JSON estático (${language}).`, error)
    categories.value = []
    products.value = []
    return { categories: [], products: [] }
  }
}

const applyCatalogLanguage = async (
  language: 'es' | 'en',
  firestoreCategories: any[],
  firestoreProducts: any[],
) => {
  if (language === 'es') {
    categories.value = firestoreCategories
    products.value = firestoreProducts
    return
  }

  categories.value = firestoreCategories.map((category: any) => ({
    ...category,
    name: category.nameEn?.trim() || category.name,
  }))

  products.value = firestoreProducts.map((product: any) => {
    return {
      ...product,
      name: product.nameEn?.trim() || product.name,
      description: product.descriptionEn?.trim() || product.description,
    }
  })
}

const hydrateClientCatalog = async (language: 'es' | 'en' = currentLang.value) => {
  try {
    if (db) {
      const [categoriesFromDb, productsFromDb] = await Promise.all([
        getCollectionSnapshot<any>('categories'),
        getCollectionSnapshot<any>('products'),
      ])

      if (categoriesFromDb.length || productsFromDb.length) {
        await applyCatalogLanguage(language, categoriesFromDb, productsFromDb)
        return
      }
    }

    await loadMenuFallback(language)
  } catch (error) {
    console.warn('No se pudo sincronizar el catálogo desde Firestore.', error)
    await loadMenuFallback(language)
  }
}

const scrollSelectedCategoryIntoView = async () => {
  await nextTick()

  const activeButton = document.querySelector(`.cat-btn[data-category="${selectedCategory.value}"]`) as HTMLElement | null
  if (activeButton) {
    activeButton.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' })
  }
}

const categories = ref<any[]>([])
const products = ref<any[]>([])
const selectedCategory = ref('')
const currentLang = ref<'es' | 'en'>('es')
const darkMode = ref(typeof window !== 'undefined' && localStorage.getItem('tpv-client-theme') === 'dark')
const selectedProductImage = ref<{ src: string; alt: string } | null>(null)

const restaurantName = computed(() => settings.value.restaurantName || 'Restaurante')
const restaurantInitials = computed(() => {
  const words = restaurantName.value.split(/\s+/).filter(Boolean)
  const initials = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase())
  return initials.join('') || 'R'
})
const heroBannerStyle = computed(() => {
  const bannerImage = settings.value.bannerImage ? normalizeProductImage(settings.value.bannerImage) : ''
  const backgroundImage = bannerImage
    ? `linear-gradient(rgba(10,10,10,0.45), rgba(10,10,10,0.45)), url('${bannerImage}')`
    : 'linear-gradient(rgba(10,10,10,0.45), rgba(10,10,10,0.45))'

  return {
    backgroundImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
})

const visibleCategories = computed(() => [
  ...categories.value,
  { id: 'contact', name: uiText.value.contactCategory },
])

const companyInfoReady = computed(() => !!settings.value.restaurantName)

const socialLinks = computed(() => {
  const items: { label: string; url: string; iconClass: string; className: string }[] = []
  const map = [
    { label: 'TikTok', url: settings.value.socials?.tiktok, iconClass: 'fa-brands fa-tiktok', className: 'tiktok' },
    { label: 'WhatsApp', url: settings.value.socials?.whatsapp, iconClass: 'fa-brands fa-whatsapp', className: 'whatsapp' },
    { label: 'Instagram', url: settings.value.socials?.instagram, iconClass: 'fa-brands fa-instagram', className: 'instagram' },
    { label: 'Facebook', url: settings.value.socials?.facebook, iconClass: 'fa-brands fa-facebook-f', className: 'facebook' },
    { label: 'Google', url: settings.value.socials?.googleReviews, iconClass: 'fa-brands fa-google', className: 'google' },
  ]

  map.forEach((item) => {
    if (item.url) {
      items.push({ label: item.label, url: item.url, iconClass: item.iconClass, className: item.className })
    }
  })

  return items
})

const deliveryServices = computed(() => [
  { label: 'Uber Eats', logo: 'https://cdn.simpleicons.org/ubereats/ffffff', url: settings.value.socials?.uberEats, className: 'uber-eats' },
  { label: 'Just Eat', logo: 'https://cdn.simpleicons.org/justeat/ffffff', url: settings.value.socials?.justEat, className: 'just-eat' },
  { label: 'Glovo', logo: 'https://cdn.simpleicons.org/glovo/1f2937', url: settings.value.socials?.glovo, className: 'glovo' },
].filter((service) => service.url))

watch(
  categories,
  (nextCategories) => {
    if (!nextCategories.length) return

    const preferredCategoryId =
      nextCategories.find((category: any) => category.id === 'burgers')?.id ||
      nextCategories[0].id

    if (!selectedCategory.value || !nextCategories.some((category: any) => category.id === selectedCategory.value)) {
      selectedCategory.value = preferredCategoryId
    }
  },
  { immediate: true },
)

watch(selectedCategory, () => {
  scrollSelectedCategoryIntoView()
}, { flush: 'post' })

watch(
  darkMode,
  (isDark) => {
    document.body.classList.toggle('dark-mode', isDark)
    localStorage.setItem('tpv-client-theme', isDark ? 'dark' : 'light')
  },
  { immediate: true },
)

const toggleTheme = () => {
  darkMode.value = !darkMode.value
}

const openProductImage = (product: any) => {
  if (!product?.image) return
  selectedProductImage.value = {
    src: product.image,
    alt: product.name || 'Producto',
  }
}

const closeImageModal = () => {
  selectedProductImage.value = null
}

const toggleLanguage = async () => {
  const nextLang = currentLang.value === 'es' ? 'en' : 'es'
  currentLang.value = nextLang
  localStorage.setItem('tpv-client-lang', nextLang)
  await Promise.all([
    hydrateClientCatalog(nextLang),
    loadSettings(nextLang),
  ])
}

onMounted(async () => {
  const storedLang = localStorage.getItem('tpv-client-lang')

  currentLang.value = storedLang === 'en' ? 'en' : 'es'

  await Promise.all([
    hydrateClientCatalog(currentLang.value),
    loadSettings(currentLang.value),
  ])
})

const productsByCategory = (categoryId: string) =>
  products.value.filter((product: any) => {
    const hasStock = !isProductOutOfStock(product)
    return product.categoryId === categoryId && product.available && hasStock
  })

const getCartQuantity = (productId: string) =>
  cart.find((item: any) => item.id === productId)?.quantity ?? 0

const decrementFromCart = (product: any) => {
  const quantity = getCartQuantity(product.id)
  if (quantity <= 1) {
    decrementItem(product.id)
    return
  }

  decrementItem(product.id)
}

const formatPrice = (value: number) => `${(Number(value) || 0).toFixed(2)} €`

</script>


