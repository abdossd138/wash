export type ServiceCategory = 'carpets' | 'cars';

export interface DynamicService {
  id: string; // e.g. "large-carpets", "car-exterior-wash"
  name: string; // Arabic name
  subname?: string; // Subtitle / specs
  description?: string;
  unit: string; // e.g. "قطعة", "سيارة", "خدمة"
  price: number; // in EGP
  icon?: string; // Lucide icon identifier
  category?: ServiceCategory; // 'carpets' or 'cars'
}

export type OrderStatus = 'received' | 'washing' | 'ready' | 'delivered' | 'cancelled';

export type DeliveryType = 'pickup' | 'dropoff';

export interface StatusMeta {
  key: OrderStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  stepIndex: number;
}

export interface Booking {
  id: string; // Firestore document ID
  orderId: string; // Simple sequential numeric string: "1", "2", "3", "14"
  orderNumber?: number; // Integer order number
  serviceCategory?: ServiceCategory; // 'carpets' | 'cars'
  carDetails?: {
    brand: string; // e.g. بي إم دبليو، هيونداي
    model: string; // e.g. M4 Competition، فيرنا
    selectedServicesList?: string[]; // e.g. ["غسيل برة", "غسيل جوة", "تغيير زيت"]
  };
  customerName: string;
  phone: string;
  deliveryType: DeliveryType; // 'pickup' (home) or 'dropoff' (shop)
  address: string;
  deliveryDate: string;
  timeSlot: string;
  items: Record<string, number>; // Maps service.id -> count
  itemsDetails?: Array<{
    serviceId: string;
    name: string;
    count: number;
    unitPrice: number;
    subtotal: number;
  }>;
  deliveryFee: number; // in EGP (0 if self drop-off)
  totalPrice: number; // in EGP
  status: OrderStatus;
  notes?: string;
  source: 'website' | 'manual' | 'phone' | 'mobile-car' | 'mobile-carpet';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  internalNotes?: string;
}

export interface SiteFeature {
  id: string;
  title: string;
  description: string;
  icon?: string; // 'Droplets' | 'Wind' | 'Flame' | 'Shield' | 'Sparkles' | 'Zap' | 'Clock' | 'HeartHandshake'
  color?: string; // 'cyan' | 'purple' | 'rose' | 'emerald' | 'amber'
  active?: boolean;
}

export interface PromoMediaItem {
  id: string;
  type: 'image' | 'video'; // 'image' or 'video'
  url: string; // image URL or YouTube/mp4 URL
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  active: boolean;
  createdAt?: string;
}

export interface AppSettings {
  businessPhone: string; // WhatsApp reception number
  adminPasscode: string; // Strictly "2255"
  deliveryFee: number; // Standard home pickup/delivery fee in EGP
  shopBranchAddress: string; // Branch address for self drop-offs
  brandName: string;
  brandTagline: string;
  coverageText?: string;
  workHoursText?: string;
  announcementText?: string;
  announcementActive?: boolean;
  isStoreLocked?: boolean; // When true, the public customer site is locked
  storeLockMessage?: string; // Custom message displayed when locked
  updatedAt?: string;
}

export interface CustomerCRMRecord {
  phone: string;
  name: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Booking[];
  tier: 'vip' | 'gold' | 'regular';
  customerNotes?: string;
}
