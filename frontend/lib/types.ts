export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  vegetarian: boolean;
  spicy: boolean;
};

export type CartItem = {
  menuItemId: number;
  restaurantId: number;
  restaurantName: string;
  itemName: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

export type RestaurantPreviewItem = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
};

export type Review = {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ReviewRequest = {
  orderId: number;
  rating: number;
  comment?: string;
};

export type RestaurantSummary = {
  id: number;
  name: string;
  brandName?: string | null;
  description: string;
  cuisine: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  distanceKm?: number | null;
  estimatedDeliveryFee?: number | null;
  featuredItems?: RestaurantPreviewItem[];
};

export type RestaurantDetail = RestaurantSummary & {
  latitude: number;
  longitude: number;
  menu: MenuItem[];
  reviews: Review[];
};

export type OrderStatus = "RECEIVED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";

export type PaymentStatus = "PENDING" | "INITIALIZED" | "PAID" | "FAILED";

export type PaymentInitialization = {
  provider: string;
  reference: string;
  authorizationUrl: string;
  simulated: boolean;
};

export type OrderItem = {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Order = {
  id: number;
  groupReference?: string | null;
  restaurantName: string;
  customerName: string;
  deliveryPersonName?: string | null;
  deliveryPersonEmail?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  restaurantLatitude: number;
  restaurantLongitude: number;
  distanceKm: number;
  subtotal: number;
  deliveryFee: number;
  ownerAllocation: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  reviewed: boolean;
  payment?: PaymentInitialization | null;
};

export type OrderBatch = {
  groupReference: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orders: Order[];
  payment?: PaymentInitialization | null;
};

export type AdminTrendPoint = {
  label: string;
  transactionCount: number;
  volume: number;
};

export type AdminTransaction = {
  id: number;
  orderId: number;
  reference: string;
  userEmail: string;
  userName: string;
  amount: number;
  status: string;
  createdAt: string;
  method: string;
  refundedAmount: number;
  chargebackAmount: number;
  highValue: boolean;
};

export type AdminAuditLog = {
  id: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export type AdminSessionRecord = {
  id: number;
  userEmail: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  userAgent?: string | null;
  active: boolean;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export type AdminUserTransactionPreview = {
  transactionId: number;
  reference: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type AdminUserInsight = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  balance: number;
  kycStatus: string;
  riskFlagged: boolean;
  alertNote?: string | null;
  transactionCount: number;
  recentTransactions: AdminUserTransactionPreview[];
};

export type AdminDashboard = {
  totalRestaurants: number;
  totalOrders: number;
  totalReviews: number;
  totalUsers: number;
  activeSessions: number;
  totalRevenue: number;
  transactionsToday: number;
  transactionsThisMonth: number;
  transactionsThisYear: number;
  refundsTotal: number;
  chargebacksTotal: number;
  netSettlementAmount: number;
  totalOwnerAllocations: number;
  volumeTrends: AdminTrendPoint[];
  topRestaurants: RestaurantSummary[];
};

export type UploadedImage = {
  url: string;
  publicId: string;
  originalFilename?: string | null;
};

export type OwnerDashboard = {
  ownerName: string;
  ownerEmail: string;
  allocatedRevenue: number;
  restaurants: RestaurantSummary[];
  orders: Order[];
};

export type DeliveryDashboard = {
  driverName: string;
  driverEmail: string;
  availableOrders: Order[];
  assignedOrders: Order[];
};

export type UserRole = "USER" | "DELIVERY" | "RESTAURANT" | "ADMIN";

export type AuthSession = {
  token: string;
  fullName: string;
  email: string;
  role: UserRole;
  expiresAt?: string;
};

export type AdminTransactionFilters = {
  start?: string;
  end?: string;
  status?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type PlaceOrderPayload = {
  restaurantId: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  customerEmail: string;
  items: Array<{
    menuItemId: number;
    quantity: number;
  }>;
};

export type PlaceGroupOrderPayload = {
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  customerEmail: string;
  items: Array<{
    menuItemId: number;
    quantity: number;
  }>;
};

export type RestaurantOwnerRegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  restaurantName: string;
  description: string;
  cuisine: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type DeliveryRegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  city: string;
  vehicleType: string;
  latitude: number;
  longitude: number;
};

export type CreateOwnerMenuItemRequest = {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  vegetarian: boolean;
  spicy: boolean;
  available: boolean;
  availableInAllBranches: boolean;
};

export type UpdateOwnerMenuItemRequest = {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  vegetarian: boolean;
  spicy: boolean;
  available: boolean;
  applyToAllBranches: boolean;
};

export type CreateRestaurantBranchRequest = {
  brandName: string;
  branchName: string;
  description: string;
  cuisine: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
};
