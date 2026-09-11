import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '../service-account.json' with { type: 'json' }

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const categoryTranslations = {
  Hamburguesas: 'Burgers',
  Cositas: 'Small bites',
  Pescados: 'Fish',
  Bocadillos: 'Sandwiches',
  Postres: 'Desserts',
  Bebidas: 'Drinks',
  'Platos principales': 'Main dishes',
  Entrantes: 'Starters',
}

const productTranslations = {
  'Agua mineral': ['Mineral water', 'Natural bottled water.'],
  'Brownie con helado': ['Brownie with ice cream', 'Warm chocolate brownie served with vanilla ice cream.'],
  'Burger de bacon': ['Bacon burger', 'Burger with crispy bacon, cheese and barbecue sauce.'],
  'Burger clásica': ['Classic burger', '180 g burger with cheddar cheese, lettuce and tomato.'],
  'Burger doble': ['Double burger', 'Double patty burger with gouda cheese, caramelized onion and house sauce.'],
  'Calamares a la romana': ['Roman-style calamari', 'Tender calamari in a crisp coating, served with lemon and parsley.'],
  'Pasta carbonara': ['Carbonara pasta', 'Spaghetti with bacon, egg, parmesan and black pepper.'],
  'Cerveza artesanal': ['Craft beer', 'Draught craft beer, 20 cl.'],
  'Coca-Cola': ['Coca-Cola', '33 cl bottle.'],
  'Croquetas de jamón ibérico': ['Iberian ham croquettes', 'Homemade croquettes with Iberian ham and creamy bechamel.'],
  'Ensalada César': ['Caesar salad', 'Romaine lettuce, grilled chicken, parmesan and Caesar dressing.'],
  'Entrecot a la plancha': ['Grilled sirloin steak', '250 g grilled steak with fries and house sauce.'],
  'Flan de la casa': ['Homemade flan', 'Homemade flan with cream and caramel sauce.'],
  'Limonada casera': ['Homemade lemonade', 'Refreshing natural lemon lemonade with mint.'],
  'Paella de marisco': ['Seafood paella', 'Traditional paella with prawns, mussels, calamari and socarrat rice.'],
  'Patatas bravas': ['Spicy potatoes', 'Fried potatoes with spicy sauce and homemade aioli.'],
  'Pollo al ajillo': ['Garlic chicken', 'Grilled chicken breast with garlic, parsley and vegetables.'],
  'Tarta de queso': ['Cheesecake', 'Creamy cheesecake with biscuit base and red berry coulis.'],
  Ptatas: ['Potatoes', 'Seasoned potatoes prepared in the house style.'],
  Lubina: ['Sea bass', 'Fresh sea bass prepared with a light house garnish.'],
  'Lomo queso': ['Pork loin with cheese', 'Grilled pork loin sandwich with melted cheese.'],
}

const updateCollection = async (collectionName, translate) => {
  const snapshot = await db.collection(collectionName).get()
  const batch = db.batch()
  let updated = 0
  let missing = 0

  snapshot.docs.forEach((document) => {
    const data = document.data()
    const translation = translate(data)
    if (!translation?.nameEn) {
      missing += 1
      return
    }

    batch.set(document.ref, {
      nameEn: translation.nameEn,
      ...(translation.descriptionEn ? { descriptionEn: translation.descriptionEn } : {}),
      updatedAt: new Date().toISOString(),
    }, { merge: true })
    updated += 1
  })

  if (updated) await batch.commit()
  console.log(`[translations] ${collectionName}: ${updated} actualizados, ${missing} sin traducción`)
}

await updateCollection('categories', (data) => ({
  nameEn: categoryTranslations[data.name],
}))

await updateCollection('products', (data) => {
  const translation = productTranslations[data.name]
  return translation ? { nameEn: translation[0], descriptionEn: translation[1] } : null
})

console.log('[translations] Traducciones de Firestore completadas')
