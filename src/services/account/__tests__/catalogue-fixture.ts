/** `GET /v1/create/catalogue` as the model service sends it (`pricing::catalogue`), for the specs. */
export const SERVICE_CATALOGUE = {
  currency: 'GBP',
  plans: [
    { id: 'free', name: 'Free', price: null, productIds: null, weeklyLimit: 20, jobsAtOnce: 1, priority: false, highDetail: false, features: { readCode: true, stepExport: true, createApi: true } },
    { id: 'plus', name: 'Plus', price: { monthly: 7.99, yearly: 79.99 }, productIds: { monthly: 'muon3d.plus.monthly', yearly: 'muon3d.plus.yearly' }, weeklyLimit: 100, jobsAtOnce: 2, priority: true, highDetail: false, features: { readCode: true, stepExport: true, createApi: true } },
    { id: 'pro', name: 'Pro', price: { monthly: 19.99, yearly: 199.99 }, productIds: { monthly: 'muon3d.pro.monthly', yearly: 'muon3d.pro.yearly' }, weeklyLimit: 300, jobsAtOnce: 4, priority: true, highDetail: true, features: { readCode: true, stepExport: true, createApi: true } }
  ],
  packs: [
    { productId: 'muon3d.credits.100', credits: 100, price: 2.99 },
    { productId: 'muon3d.credits.500', credits: 500, price: 12.99 },
    { productId: 'muon3d.credits.1500', credits: 1500, price: 34.99 }
  ],
  costs: { part: 4, partChange: 2, shape: 20, shapeRefine: 12, photo: 15, scan: 30, highDetail: 40 }
}
