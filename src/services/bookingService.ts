import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Booking, DynamicService, OrderStatus, AppSettings, DeliveryType, SiteFeature, PromoMediaItem } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SERVICES, DEFAULT_FEATURES } from '../constants';

const BOOKINGS_COLLECTION = 'bookings';
const SERVICES_COLLECTION = 'services';
const FEATURES_COLLECTION = 'features';
const MEDIA_COLLECTION = 'promo_media';
const SETTINGS_COLLECTION = 'settings';
const CONFIG_DOC_ID = 'config';
const COUNTER_DOC_ID = 'counters';

// Helper to generate a unique random document ID
export function generateDocId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

/* =========================================================================
   DYNAMIC SERVICES & PRODUCTS (FULL CRUD)
   ========================================================================= */

// Subscribe to services in real time from Firestore
export function subscribeToServices(
  onSuccess: (services: DynamicService[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const servicesRef = collection(db, SERVICES_COLLECTION);

  // Immediately notify from localStorage cache if available
  try {
    const cached = localStorage.getItem('cleanpro_services');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onSuccess(parsed);
      }
    }
  } catch (e) {}

  return onSnapshot(
    servicesRef,
    (snapshot) => {
      const services: DynamicService[] = [];
      snapshot.forEach((docSnap) => {
        services.push({ ...docSnap.data(), id: docSnap.id } as DynamicService);
      });
      if (services.length > 0) {
        try {
          localStorage.setItem('cleanpro_services', JSON.stringify(services));
        } catch (e) {}
        onSuccess(services);
      }
    },
    (error) => {
      console.warn('Firestore subscription warning, using local cache:', error);
      try {
        const cached = localStorage.getItem('cleanpro_services');
        if (cached) {
          onSuccess(JSON.parse(cached));
          return;
        }
      } catch (e) {}
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, SERVICES_COLLECTION);
    }
  );
}

// Add a new dynamic service
export async function createServiceInFirestore(serviceData: Omit<DynamicService, 'id'> & { id?: string }): Promise<DynamicService> {
  const serviceId = serviceData.id || generateDocId();
  const path = `${SERVICES_COLLECTION}/${serviceId}`;
  
  const newService: DynamicService = {
    id: serviceId,
    name: serviceData.name.trim(),
    subname: serviceData.subname?.trim() || '',
    description: serviceData.description?.trim() || '',
    unit: serviceData.unit.trim() || 'قطعة',
    price: Number(serviceData.price) || 0,
    icon: serviceData.icon || 'Sparkles',
  };

  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId);
    await setDoc(docRef, newService);
    return newService;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update an existing service (title, price, unit, description)
export async function updateServiceInFirestore(
  serviceId: string,
  updates: Partial<Omit<DynamicService, 'id'>>
): Promise<void> {
  const path = `${SERVICES_COLLECTION}/${serviceId}`;
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete a service
export async function deleteServiceFromFirestore(serviceId: string): Promise<void> {
  const path = `${SERVICES_COLLECTION}/${serviceId}`;
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Seed default services if collection is empty or missing car services
export async function seedDefaultServicesIfEmpty(): Promise<void> {
  try {
    const servicesRef = collection(db, SERVICES_COLLECTION);
    const snap = await getDocs(servicesRef);
    const existingIds = new Set(snap.docs.map((d) => d.id));

    for (const service of DEFAULT_SERVICES) {
      if (!existingIds.has(service.id)) {
        await setDoc(doc(db, SERVICES_COLLECTION, service.id), service);
      }
    }
  } catch (e) {
    console.warn('Default services seeding skipped or failed:', e);
  }
}

/* =========================================================================
   SEQUENTIAL ORDER ID GENERATOR (#1, #2, #3, ...)
   ========================================================================= */

export async function getNextSequentialOrderId(): Promise<number> {
  const counterRef = doc(db, SETTINGS_COLLECTION, COUNTER_DOC_ID);

  try {
    const nextNumber = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let currentNumber = 1;

      if (counterSnap.exists()) {
        const data = counterSnap.data();
        currentNumber = typeof data.lastOrderNumber === 'number' ? data.lastOrderNumber + 1 : 1;
      } else {
        currentNumber = 1;
      }

      transaction.set(counterRef, {
        lastOrderNumber: currentNumber,
        updatedAt: new Date().toISOString(),
      });

      return currentNumber;
    });

    try {
      localStorage.setItem('cleanpro_order_counter', String(nextNumber));
    } catch (e) {}

    return nextNumber;
  } catch (error) {
    console.warn('Transaction on counter failed, determining next ID from cloud database:', error);
    try {
      const bookingsSnap = await getDocs(collection(db, BOOKINGS_COLLECTION));
      let maxNumber = 0;
      bookingsSnap.forEach((d) => {
        const data = d.data();
        const num = typeof data.orderNumber === 'number' ? data.orderNumber : parseInt(String(data.orderId || '0'), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      });
      const nextNumber = maxNumber + 1;
      try {
        await setDoc(counterRef, {
          lastOrderNumber: nextNumber,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {}
      localStorage.setItem('cleanpro_order_counter', String(nextNumber));
      return nextNumber;
    } catch (dbErr) {
      const localCounter = Number(localStorage.getItem('cleanpro_order_counter') || '0') + 1;
      localStorage.setItem('cleanpro_order_counter', String(localCounter));
      return localCounter;
    }
  }
}

/* =========================================================================
   BOOKINGS MANAGEMENT
   ========================================================================= */

// Create a new booking in Firestore with delivery options and sequential ID
export async function createBookingInFirestore(data: {
  orderId?: string;
  orderNumber?: number;
  serviceCategory?: 'carpets' | 'cars';
  carDetails?: {
    brand: string;
    model: string;
    selectedServicesList?: string[];
  };
  customerName: string;
  phone: string;
  deliveryType: DeliveryType;
  address: string;
  deliveryDate: string;
  timeSlot: string;
  items: Record<string, number>;
  itemsDetails?: Array<{
    serviceId: string;
    name: string;
    count: number;
    unitPrice: number;
    subtotal: number;
  }>;
  deliveryFee: number;
  totalPrice: number;
  notes?: string;
  source?: 'website' | 'manual' | 'phone' | 'mobile-car' | 'mobile-carpet';
}): Promise<Booking> {
  const docId = generateDocId();
  const nextNum = data.orderNumber || (await getNextSequentialOrderId());
  const orderId = data.orderId || String(nextNum);
  const now = new Date().toISOString();

  const newBooking: Booking = {
    id: docId,
    orderId, // Simple numeric string e.g. "1", "2", "14"
    orderNumber: nextNum,
    serviceCategory: data.serviceCategory || 'carpets',
    carDetails: data.carDetails,
    customerName: data.customerName.trim(),
    phone: data.phone.trim(),
    deliveryType: data.deliveryType,
    address: data.address.trim(),
    deliveryDate: data.deliveryDate,
    timeSlot: data.timeSlot,
    items: data.items,
    itemsDetails: data.itemsDetails,
    deliveryFee: data.deliveryFee,
    totalPrice: data.totalPrice,
    status: 'received',
    notes: data.notes?.trim() || '',
    source: data.source || 'website',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const rawList = localStorage.getItem('cleanpro_bookings');
    const list = rawList ? JSON.parse(rawList) : [];
    list.unshift(newBooking);
    localStorage.setItem('cleanpro_bookings', JSON.stringify(list.slice(0, 100)));
  } catch (e) {}

  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, docId);
    await setDoc(bookingRef, newBooking);
    console.log('Saved booking to Cloud Firestore successfully: Order #' + orderId);
    return newBooking;
  } catch (error) {
    console.error('Failed to commit booking to Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, `${BOOKINGS_COLLECTION}/${docId}`);
  }
}

// Subscribe to real-time changes across all bookings (Admin Live Sync)
export function subscribeToBookings(
  onSuccess: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const bookingsRef = collection(db, BOOKINGS_COLLECTION);
  const q = query(bookingsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        bookings.push({ ...docSnap.data(), id: docSnap.id } as Booking);
      });
      onSuccess(bookings);
    },
    (error) => {
      console.error('Subscription error in bookings:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, BOOKINGS_COLLECTION);
    }
  );
}

// Update the status of an existing booking
export async function updateBookingStatus(
  bookingId: string,
  newStatus: OrderStatus,
  internalNotes?: string
): Promise<void> {
  const path = `${BOOKINGS_COLLECTION}/${bookingId}`;
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    if (internalNotes !== undefined) {
      updatePayload.internalNotes = internalNotes;
    }
    await updateDoc(bookingRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete a booking
export async function deleteBooking(bookingId: string): Promise<void> {
  const path = `${BOOKINGS_COLLECTION}/${bookingId}`;
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await deleteDoc(bookingRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Lookup booking by simple sequential numeric ID (#1, 1, #14) or Phone Number
export async function searchBookingsForCustomer(searchTerm: string): Promise<Booking[]> {
  const raw = searchTerm.trim();
  if (!raw) return [];

  const cleanTerm = raw.replace(/[#\s]/g, '').toLowerCase();

  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const snapshot = await getDocs(bookingsRef);
    const matched: Booking[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Booking;
      const orderIdStr = String(data.orderId || '').replace(/[#\s]/g, '').toLowerCase();
      const phoneDigits = String(data.phone || '').replace(/\D/g, '');
      const searchDigits = cleanTerm.replace(/\D/g, '');

      const orderMatch = orderIdStr === cleanTerm;
      const phoneMatch =
        searchDigits.length >= 4 &&
        (phoneDigits.includes(searchDigits) || searchDigits.includes(phoneDigits));

      if (orderMatch || phoneMatch) {
        matched.push({ ...data, id: docSnap.id });
      }
    });

    if (matched.length === 0) {
      try {
        const rawList = localStorage.getItem('cleanpro_bookings');
        if (rawList) {
          const localList: Booking[] = JSON.parse(rawList);
          localList.forEach((data) => {
            const orderIdStr = String(data.orderId || '').replace(/[#\s]/g, '').toLowerCase();
            const phoneDigits = String(data.phone || '').replace(/\D/g, '');
            const searchDigits = cleanTerm.replace(/\D/g, '');

            const orderMatch = orderIdStr === cleanTerm;
            const phoneMatch =
              searchDigits.length >= 4 &&
              (phoneDigits.includes(searchDigits) || searchDigits.includes(phoneDigits));

            if (orderMatch || phoneMatch) {
              if (!matched.some((m) => m.id === data.id)) {
                matched.push(data);
              }
            }
          });
        }
      } catch (e) {}
    }

    return matched.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.warn('Firestore query failed, searching local cache:', error);
    const matched: Booking[] = [];
    try {
      const rawList = localStorage.getItem('cleanpro_bookings');
      if (rawList) {
        const localList: Booking[] = JSON.parse(rawList);
        localList.forEach((data) => {
          const orderIdStr = String(data.orderId || '').replace(/[#\s]/g, '').toLowerCase();
          const phoneDigits = String(data.phone || '').replace(/\D/g, '');
          const searchDigits = cleanTerm.replace(/\D/g, '');

          const orderMatch = orderIdStr === cleanTerm;
          const phoneMatch =
            searchDigits.length >= 4 &&
            (phoneDigits.includes(searchDigits) || searchDigits.includes(phoneDigits));

          if (orderMatch || phoneMatch) {
            matched.push(data);
          }
        });
      }
    } catch (e) {}
    return matched;
  }
}

/* =========================================================================
   SETTINGS & SYSTEM CONFIG
   ========================================================================= */

export async function fetchAppSettings(): Promise<AppSettings> {
  const path = `${SETTINGS_COLLECTION}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const settings = {
        ...DEFAULT_SETTINGS,
        ...data,
        adminPasscode: '2255', // strictly 2255 as required
        brandName: data.brandName || DEFAULT_SETTINGS.brandName,
        deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : DEFAULT_SETTINGS.deliveryFee,
      } as AppSettings;

      try {
        localStorage.setItem('cleanpro_settings', JSON.stringify(settings));
      } catch (e) {}

      return settings;
    } else {
      await setDoc(docRef, DEFAULT_SETTINGS);
      try {
        localStorage.setItem('cleanpro_settings', JSON.stringify(DEFAULT_SETTINGS));
      } catch (e) {}
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.warn('Could not fetch cloud settings, falling back to local storage defaults:', error);
    try {
      const cached = localStorage.getItem('cleanpro_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_SETTINGS;
  }
}

// Live real-time subscription for global settings (Branding, Phone, Fees)
export function subscribeToAppSettings(
  onSuccess: (settings: AppSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const settings = {
          ...DEFAULT_SETTINGS,
          ...data,
          adminPasscode: '2255',
          brandName: data.brandName || DEFAULT_SETTINGS.brandName,
          deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : DEFAULT_SETTINGS.deliveryFee,
        } as AppSettings;
        try {
          localStorage.setItem('cleanpro_settings', JSON.stringify(settings));
        } catch (e) {}
        onSuccess(settings);
      }
    },
    (error) => {
      console.warn('Settings subscription fallback:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const existing = localStorage.getItem('cleanpro_settings');
    const merged = existing ? { ...JSON.parse(existing), ...settings } : { ...DEFAULT_SETTINGS, ...settings };
    localStorage.setItem('cleanpro_settings', JSON.stringify(merged));
  } catch (e) {}

  const path = `${SETTINGS_COLLECTION}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await setDoc(
      docRef,
      {
        ...settings,
        adminPasscode: '2255',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   EXCEL & CSV REPORT EXPORT (.CSV with UTF-8 BOM)
   ========================================================================= */

export function exportBookingsToCSV(bookings: Booking[], brandName = 'CleanPro'): void {
  const headers = [
    'رقم الطلب',
    'اسم العميل',
    'رقم الهاتف',
    'طريقة الاستلام',
    'العنوان',
    'تاريخ الحجز',
    'الفترة الزمنية',
    'تفاصيل المفروشات والأصناف',
    'رسوم التوصيل (ج.م)',
    'إجمالي الفاتورة (ج.م)',
    'حالة الطلب',
    'المصدر',
    'ملاحظات العميل',
    'تاريخ ووقت التسجيل',
  ];

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const statusMap: Record<string, string> = {
    received: 'تم الاستلام والفرز',
    washing: 'جاري الغسيل والتعقيم',
    ready: 'جاهز للتسليم',
    delivered: 'تم التسليم بنجاح',
    cancelled: 'ملغي',
  };

  const rows = bookings.map((b) => {
    const itemsStr = b.itemsDetails && b.itemsDetails.length > 0
      ? b.itemsDetails.map((it) => `${it.name}: ${it.count} (${it.subtotal} ج.م)`).join(' | ')
      : Object.entries(b.items || {})
          .filter(([, count]) => count > 0)
          .map(([k, count]) => `${k}: ${count}`)
          .join(' | ');

    const deliveryStr = b.deliveryType === 'pickup' ? 'استلام وتوصيل منزلي' : 'تسليم بالفرع بنفسي';

    return [
      escapeCSV(`#${b.orderId}`),
      escapeCSV(b.customerName),
      escapeCSV(b.phone),
      escapeCSV(deliveryStr),
      escapeCSV(b.address),
      escapeCSV(b.deliveryDate),
      escapeCSV(b.timeSlot),
      escapeCSV(itemsStr || 'غير محدد'),
      escapeCSV(b.deliveryFee),
      escapeCSV(b.totalPrice),
      escapeCSV(statusMap[b.status] || b.status),
      escapeCSV(b.source === 'website' ? 'الموقع الإلكتروني' : 'تسجيل يدوي/هاتف'),
      escapeCSV(b.notes || ''),
      escapeCSV(b.createdAt ? new Date(b.createdAt).toLocaleString('ar-EG') : ''),
    ].join(',');
  });

  // UTF-8 Byte Order Mark (\uFEFF) forces Microsoft Excel to open Arabic text correctly without garbled symbols
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const safeBrand = (brandName || 'CleanPro').replace(/[\s/\\:]+/g, '_');
  a.href = url;
  a.download = `تقرير_طلبات_${safeBrand}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =========================================================================
   WHATSAPP MESSAGE BUILDER WITH DELIVERY OPTIONS
   ========================================================================= */

export function buildWhatsAppMessage(
  booking: Booking,
  businessPhone: string,
  servicesList: DynamicService[],
  brandName?: string
): string {
  const storeName = brandName?.trim() || 'CleanPro Express';
  const isCarBooking = booking.serviceCategory === 'cars' || Boolean(booking.carDetails);

  if (isCarBooking) {
    const deliveryTypeLabel =
      booking.deliveryType === 'pickup'
        ? '🚚 مغسلة دليفري متنقلة أمام البيت / الجراج'
        : '🏢 تسليم وغسيل في مقر المغسلة';

    const itemsText = (booking.itemsDetails && booking.itemsDetails.length > 0)
      ? booking.itemsDetails
          .map((item) => `▫️ ${item.name}: ${item.count} (${item.subtotal} ج.م)`)
          .join('\n')
      : servicesList
          .map((srv) => {
            const count = booking.items[srv.id] || 0;
            if (count > 0) {
              return `▫️ ${srv.name}: ${count} ${srv.unit} (${srv.price * count} ج.م)`;
            }
            return null;
          })
          .filter(Boolean)
          .join('\n');

    const carMakeStr = booking.carDetails?.brand || 'سيارة خاصة';
    const carModelStr = booking.carDetails?.model || 'غير محدد';

    const message = `🚗✨ *طلب حجز غسيل وصيانة سيارات - ${storeName}* ✨🚗
━━━━━━━━━━━━━━━━━━
🔖 *رقم الطلب*: *#${booking.orderId}*
🚘 *ماركة السيارة*: ${carMakeStr}
🏎️ *موديل / نسخة السيارة*: ${carModelStr}
👤 *اسم العميل*: ${booking.customerName}
📞 *رقم هاتف العميل (المشتري)*: ${booking.phone}
📍 *طريقة ومكان الخدمة*: ${deliveryTypeLabel}
${booking.deliveryType === 'pickup' ? `📍 *عنوان العميل*: ${booking.address}` : '📍 *الموقع*: استلام بمقر المغسلة'}
📅 *تاريخ الحجز*: ${booking.deliveryDate}
⏰ *الفترة الزمنية*: ${booking.timeSlot}

🛠️ *الخدمات المطلوبة للسيارة*:
${itemsText || 'لم يتم تحديد خدمات'}

${booking.deliveryFee > 0 ? `🚚 رسوم الخدمة المتنقلة: ${booking.deliveryFee} جنيه مصري\n` : ''}💰 *الإجمالي المستحق*: *${booking.totalPrice} جنيه مصري*
${booking.notes ? `📝 *ملاحظات خاصة*: ${booking.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━
رقم طلبكم للتتبع السريع هو *#${booking.orderId}*`;

    return message;
  }

  // STANDARD CARPETS & FURNITURE BOOKING
  const deliveryTypeLabel =
    booking.deliveryType === 'pickup'
      ? '🚚 استلام وتوصيل منزلي'
      : '🏢 تسليم بالفرع بنفسي';

  const itemsText = (booking.itemsDetails && booking.itemsDetails.length > 0)
    ? booking.itemsDetails
        .map((item) => `▫️ ${item.name}: ${item.count} (${item.subtotal} ج.م)`)
        .join('\n')
    : servicesList
        .map((srv) => {
          const count = booking.items[srv.id] || 0;
          if (count > 0) {
            return `▫️ ${srv.name}: ${count} ${srv.unit} (${srv.price * count} ج.م)`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');

  const deliveryFeeLine =
    booking.deliveryType === 'pickup'
      ? `🚚 رسوم الاستلام والتوصيل: ${booking.deliveryFee} جنيه`
      : '🏢 رسوم التوصيل: مجاناً (تسليم بالفرع)';

  const message = `✨ *طلب حجز غسيل سجاد ومفروشات - ${storeName}* ✨
━━━━━━━━━━━━━━━━━━
🔖 *رقم الطلب*: *#${booking.orderId}*
👤 *اسم العميل*: ${booking.customerName}
📞 *رقم هاتف العميل (المشتري)*: ${booking.phone}
📦 *طريقة الاستلام*: ${deliveryTypeLabel}
${booking.deliveryType === 'pickup' ? `📍 *عنوان الاستلام*: ${booking.address}` : `📍 *الموقع*: استلام بالفرع`}
📅 *تاريخ الاستلام*: ${booking.deliveryDate}
⏰ *الفترة الزمنية*: ${booking.timeSlot}

🧺 *تفاصيل المفروشات*:
${itemsText || 'لم يتم تحديد عناصر'}

${deliveryFeeLine}
💰 *الإجمالي المستحق*: *${booking.totalPrice} جنيه مصري*
${booking.notes ? `📝 *ملاحظات*: ${booking.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━
رقم طلبكم للتتبع السريع هو *#${booking.orderId}*`;

  return message;
}

export function normalizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  // If local Egyptian mobile format (e.g. 010..., 011..., 012..., 015... - 11 digits starting with 01)
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits; // becomes 201xxxxxxxxx for international WhatsApp
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  }
  return digits;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildStatusWhatsAppUrl(
  booking: Booking,
  newStatusLabel: string,
  businessPhone: string,
  brandName?: string
): string {
  const storeName = brandName?.trim() || 'CleanPro Express';
  const message = `مرحباً أستاذ/ة *${booking.customerName}* 👋
تحديث لحالة طلبكم رقم *#${booking.orderId}* في ${storeName}:

الحالة الحالية: *${newStatusLabel}* 🚀
طريقة الاستلام: ${booking.deliveryType === 'pickup' ? 'استلام وتوصيل للمنزل' : 'استلام بالفرع'}
💰 الإجمالي: ${booking.totalPrice} ج.م

يمكنكم دائماً تتبع حالة طلبكم عبر موقعنا بإدخال رقم الطلب (#${booking.orderId}) أو رقم الهاتف.
شكراً لاختياركم ${storeName}! ✨`;

  return getWhatsAppUrl(booking.phone, message);
}

/* =========================================================================
   DYNAMIC SITE FEATURES & HIGHLIGHTS (FULL CRUD)
   ========================================================================= */

// Subscribe to site features in real time from Firestore
export function subscribeToFeatures(
  onSuccess: (features: SiteFeature[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const featuresRef = collection(db, FEATURES_COLLECTION);

  // Cached fallback
  try {
    const cached = localStorage.getItem('cleanpro_features');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onSuccess(parsed);
      }
    }
  } catch (e) {}

  return onSnapshot(
    featuresRef,
    (snapshot) => {
      const features: SiteFeature[] = [];
      snapshot.forEach((docSnap) => {
        features.push({ ...docSnap.data(), id: docSnap.id } as SiteFeature);
      });
      if (features.length > 0) {
        try {
          localStorage.setItem('cleanpro_features', JSON.stringify(features));
        } catch (e) {}
        onSuccess(features);
      } else {
        // If empty, return default features
        onSuccess(DEFAULT_FEATURES);
      }
    },
    (error) => {
      console.warn('Firestore features subscription warning, using defaults:', error);
      try {
        const cached = localStorage.getItem('cleanpro_features');
        if (cached) {
          onSuccess(JSON.parse(cached));
          return;
        }
      } catch (e) {}
      onSuccess(DEFAULT_FEATURES);
      if (onError) onError(error);
    }
  );
}

// Add a new dynamic feature
export async function createFeatureInFirestore(
  featureData: Omit<SiteFeature, 'id'> & { id?: string }
): Promise<SiteFeature> {
  const featureId = featureData.id || `feat-${Date.now()}`;
  const path = `${FEATURES_COLLECTION}/${featureId}`;

  const newFeature: SiteFeature = {
    id: featureId,
    title: featureData.title.trim(),
    description: featureData.description.trim(),
    icon: featureData.icon || 'Sparkles',
    color: featureData.color || 'cyan',
    active: featureData.active !== undefined ? featureData.active : true,
  };

  try {
    const docRef = doc(db, FEATURES_COLLECTION, featureId);
    await setDoc(docRef, newFeature);
    return newFeature;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update existing feature
export async function updateFeatureInFirestore(
  featureId: string,
  updates: Partial<Omit<SiteFeature, 'id'>>
): Promise<void> {
  const path = `${FEATURES_COLLECTION}/${featureId}`;
  try {
    const docRef = doc(db, FEATURES_COLLECTION, featureId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete feature
export async function deleteFeatureInFirestore(featureId: string): Promise<void> {
  const path = `${FEATURES_COLLECTION}/${featureId}`;
  try {
    const docRef = doc(db, FEATURES_COLLECTION, featureId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Seed default features if collection is empty
export async function seedDefaultFeaturesIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, FEATURES_COLLECTION));
    if (snap.empty) {
      for (const feat of DEFAULT_FEATURES) {
        await setDoc(doc(db, FEATURES_COLLECTION, feat.id), feat);
      }
    }
  } catch (e) {
    console.warn('Seeding default features fallback:', e);
  }
}

/* =========================================================================
   PROMO MEDIA (IMAGES & VIDEOS) BANNER
   ========================================================================= */

// Subscribe to promo media (photos & videos)
export function subscribeToPromoMedia(
  onSuccess: (items: PromoMediaItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const mediaRef = collection(db, MEDIA_COLLECTION);

  try {
    const cached = localStorage.getItem('cleanpro_promo_media');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        onSuccess(parsed);
      }
    }
  } catch (e) {}

  return onSnapshot(
    mediaRef,
    (snapshot) => {
      const items: PromoMediaItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id } as PromoMediaItem);
      });
      try {
        localStorage.setItem('cleanpro_promo_media', JSON.stringify(items));
      } catch (e) {}
      onSuccess(items);
    },
    (error) => {
      console.warn('Firestore promo media subscription warning:', error);
      if (onError) onError(error);
    }
  );
}

// Add promo media (image or video)
export async function createPromoMediaInFirestore(
  mediaData: Omit<PromoMediaItem, 'id'> & { id?: string }
): Promise<PromoMediaItem> {
  const mediaId = mediaData.id || `media-${Date.now()}`;
  const path = `${MEDIA_COLLECTION}/${mediaId}`;

  const newItem: PromoMediaItem = {
    id: mediaId,
    type: mediaData.type,
    url: mediaData.url.trim(),
    title: mediaData.title?.trim() || '',
    subtitle: mediaData.subtitle?.trim() || '',
    linkUrl: mediaData.linkUrl?.trim() || '',
    active: mediaData.active !== undefined ? mediaData.active : true,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, MEDIA_COLLECTION, mediaId);
    await setDoc(docRef, newItem);
    return newItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update promo media
export async function updatePromoMediaInFirestore(
  mediaId: string,
  updates: Partial<Omit<PromoMediaItem, 'id'>>
): Promise<void> {
  const path = `${MEDIA_COLLECTION}/${mediaId}`;
  try {
    const docRef = doc(db, MEDIA_COLLECTION, mediaId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete promo media
export async function deletePromoMediaFromFirestore(mediaId: string): Promise<void> {
  const path = `${MEDIA_COLLECTION}/${mediaId}`;
  try {
    const docRef = doc(db, MEDIA_COLLECTION, mediaId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   EMERGENCY STORE LOCK / KILL-SWITCH (STRICT PASSCODE: 1177)
   ========================================================================= */

export async function setStoreLockInFirestore(
  locked: boolean,
  passcode: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  // STRICT EVALUATION: Passcode MUST be strictly string "1177"
  if (passcode.trim() !== '1177') {
    return {
      success: false,
      error: 'رمز الأمان السري غير صحيح. تم رفض العملية لأسباب أمنية.',
    };
  }

  try {
    const updates: Partial<AppSettings> = {
      isStoreLocked: locked,
      ...(customMessage !== undefined ? { storeLockMessage: customMessage.trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    await saveAppSettings(updates);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'تعذر حفظ حالة القفل في قاعدة البيانات.',
    };
  }
}

