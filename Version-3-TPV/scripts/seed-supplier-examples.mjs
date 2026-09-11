import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '../service-account.json' with { type: 'json' }

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()
const now = new Date().toISOString()
const suppliers = [
  {
    id: 'supplier-distribuciones-garcia',
    company: 'Distribuciones Garcia',
    products: 'Bebidas, aguas y refrescos',
    address: 'Calle de Alcala 145, Madrid',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Distribuciones+Garcia+Madrid',
    phone: '+34 914 582 310',
    email: 'pedidos@distribucionesgarcia.example',
  },
  {
    id: 'supplier-carnicas-centro',
    company: 'Carnicas del Centro',
    products: 'Carne de ternera, pollo y hamburguesas',
    address: 'Calle Rio Jarama 8, Toledo',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Carnicas+del+Centro+Toledo',
    phone: '+34 925 214 680',
    email: 'ventas@carnicascentro.example',
  },
  {
    id: 'supplier-huerta-fresca',
    company: 'Huerta Fresca',
    products: 'Verduras, hortalizas y frutas',
    address: 'Mercado Central, Puesto 42, Madrid',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mercado+Central+Madrid',
    phone: '+34 915 330 244',
    email: 'pedidos@huertafresca.example',
  },
  {
    id: 'supplier-congelados-iberia',
    company: 'Congelados Iberia',
    products: 'Patatas, pescados y productos congelados',
    address: 'Avenida de la Industria 27, Getafe',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Avenida+de+la+Industria+27+Getafe',
    phone: '+34 916 820 517',
    email: 'comercial@congeladosiberia.example',
  },
  {
    id: 'supplier-panaderia-artesana',
    company: 'Panaderia Artesana San Juan',
    products: 'Pan de hamburguesa, panes y bolleria',
    address: 'Calle San Juan 18, Alcobendas',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Panaderia+Artesana+San+Juan+Alcobendas',
    phone: '+34 916 541 903',
    email: 'hola@panaderiasanjuan.example',
  },
  {
    id: 'supplier-lacteos-la-sierra',
    company: 'Lacteos La Sierra',
    products: 'Quesos, leche, nata y mantequilla',
    address: 'Carretera de la Sierra 52, Segovia',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lacteos+La+Sierra+Segovia',
    phone: '+34 921 440 126',
    email: 'pedidos@lacteoslasierra.example',
  },
  {
    id: 'supplier-salsas-sabor',
    company: 'Salsas y Sabores',
    products: 'Salsas, especias y aliños',
    address: 'Calle del Comercio 11, Mostoles',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Calle+del+Comercio+11+Mostoles',
    phone: '+34 916 145 772',
    email: 'clientes@salsasysabores.example',
  },
  {
    id: 'supplier-cafe-aroma',
    company: 'Cafe Aroma Profesional',
    products: 'Cafe, te y productos para cafeteria',
    address: 'Calle Embajadores 76, Madrid',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Cafe+Aroma+Profesional+Madrid',
    phone: '+34 915 284 610',
    email: 'hosteleria@cafearoma.example',
  },
  {
    id: 'supplier-envases-hosteleria',
    company: 'Envases Hosteleria',
    products: 'Envases para take away, bolsas y servilletas',
    address: 'Avenida del Vidrio 6, Fuenlabrada',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Avenida+del+Vidrio+6+Fuenlabrada',
    phone: '+34 916 973 421',
    email: 'ventas@envaseshosteleria.example',
  },
  {
    id: 'supplier-limpieza-profesional',
    company: 'Limpieza Profesional Horeca',
    products: 'Productos de limpieza y desinfeccion',
    address: 'Calle de la Tecnica 19, Coslada',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Calle+de+la+Tecnica+19+Coslada',
    phone: '+34 916 702 885',
    email: 'pedidos@limpiezahoreca.example',
  },
]

const batch = db.batch()
suppliers.forEach((supplier) => {
  batch.set(db.collection('suppliers').doc(supplier.id), {
    ...supplier,
    createdAt: now,
    updatedAt: now,
  }, { merge: true })
})
await batch.commit()
console.log(`Proveedores de ejemplo guardados: ${suppliers.length}`)
