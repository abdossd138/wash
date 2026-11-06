import { DynamicService, StatusMeta, OrderStatus, AppSettings } from './types';

export const DEFAULT_SERVICES: DynamicService[] = [
  {
    id: 'large-carpets',
    name: 'سجاد صالون فاخر (كبير)',
    subname: 'مقاس 3×4م أو أكبر / سجاد إيراني وتركي',
    description: 'غسيل عميق بأحدث ماكينات الفرش الدوارة مع الحفاظ على لمعان الحرير وأنسجة الصوف الطبيعي.',
    unit: 'قطعة',
    price: 180,
    icon: 'Sparkles',
  },
  {
    id: 'runners',
    name: 'مشايات وسجاد ممرات (وسط وصغير)',
    subname: 'مشايات ممرات وغرف نوم حتى 2×3م',
    description: 'معالجة البقع العنيدة وإزالة الروائح مع شطف كامل بحوض الطرد المركزي السريع.',
    unit: 'قطعة',
    price: 95,
    icon: 'Layers',
  },
  {
    id: 'sofas',
    name: 'أطقم كنب وأنتريهات وركنات',
    subname: 'تنظيف رغوة جافة وشفط حقن للأقمشة',
    description: 'تنظيف وتجديد ألوان أقمشة الشانيل، المخمل، والكتان بمكائن الحقن والشفط.',
    unit: 'مقعد/قطعة',
    price: 120,
    icon: 'Armchair',
  },
  {
    id: 'blankets',
    name: 'بطاطين وألحفة فايبر دبل',
    subname: 'ألحفة عرائس، بطاطين مورا وإسباني',
    description: 'غسيل بماء معقم ومعطرات فرنسية مع تجفيف حراري فوري يمنع التكتل.',
    unit: 'قطعة',
    price: 140,
    icon: 'CloudRain',
  },
  {
    id: 'dry-cleaning',
    name: 'غسيل جاف للمفروشات الحساسة',
    subname: 'حرير طبيعي، جوبلان، كشمير وستاير',
    description: 'تنظيف بتقنية المذيبات الألمانية العضوية لحماية الألياف الرفيعة والمطرزات الدقيقة.',
    unit: 'قطعة',
    price: 210,
    icon: 'ShieldCheck',
  },
  {
    id: 'steam-sanitation',
    name: 'تعقيم نانو بخار وأوزون',
    subname: 'قتل 99.9% من البكتيريا وحشرات الفراش',
    description: 'تطبيق بخار جاف تحت ضغط عالي 120°C مع معالجة بالأوزون المضاد للحساسية.',
    unit: 'خدمة إضافية',
    price: 110,
    icon: 'Flame',
  },
];

export const SERVICE_ITEMS = DEFAULT_SERVICES;

export const STATUS_METADATA: Record<OrderStatus, StatusMeta> = {
  received: {
    key: 'received',
    label: 'تم الاستلام والفرز',
    description: 'تم استلام المفروشات وتسجيلها في النظام لبدء الفحص وتحديد نوع الأنسجة والبقع.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    stepIndex: 1,
  },
  washing: {
    key: 'washing',
    label: 'جاري الغسيل والتعقيم',
    description: 'يتم الغسيل الآلي بالفرش الدوارة والشطف بالطرد المركزي والتعقيم بالبخار 120°C والأوزون.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    stepIndex: 2,
  },
  ready: {
    key: 'ready',
    label: 'جاهز ومغلف للتسليم',
    description: 'تم اجتياز مراقبة الجودة، والتعطير الفاخر، والتغليف الحراري المحكم وجاهز للتسليم.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    stepIndex: 3,
  },
  delivered: {
    key: 'delivered',
    label: 'تم التسليم بنجاح',
    description: 'تم تسليم الطلب إلى العميل بالكامل مع ضمان الرضا والنظافة الفندقية التامة.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    stepIndex: 4,
  },
  cancelled: {
    key: 'cancelled',
    label: 'طلب ملغي',
    description: 'تم إلغاء هذا الطلب بناء على طلب العميل أو عدم توافر الخدمة.',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    stepIndex: 0,
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  businessPhone: '201023456789',
  brandName: 'CleanPro Express',
  brandTagline: 'مغسلة السجاد والمفروشات الفاخرة بالبخار والأوزون',
  adminPasscode: '2255', // Strictly 2255 as requested
  deliveryFee: 40, // Standard home pickup/delivery fee in EGP
  shopBranchAddress: 'فرع المغسلة الرئيسي: التجمع الخامس، شارع التسعين الشمالي، القاهرة الجديدة',
};

export const TIME_SLOTS = [
  { id: 'morning', label: 'الفترة الصباحية (10:00 ص - 02:00 م)' },
  { id: 'afternoon', label: 'فترة الظهيرة (02:00 م - 05:00 م)' },
  { id: 'evening', label: 'الفترة المسائية (05:00 م - 10:00 م)' },
];
