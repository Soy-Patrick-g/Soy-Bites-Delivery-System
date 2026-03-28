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

export type Coordinates = {
  latitude: number;
  longitude: number;
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
  verified: boolean;
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
  active: boolean;
  balance: number;
  kycStatus: string;
  riskFlagged: boolean;
  alertNote?: string | null;
  transactionCount: number;
  recentTransactions: AdminUserTransactionPreview[];
};

export type AdminDeliveryPersonnelEarnings = {
  deliveryPersonId: number;
  deliveryPersonName: string;
  deliveryPersonEmail: string;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  completedDeliveries: number;
};

export type AdminDeliveryCommission = {
  id: number;
  deliveryPersonId: number;
  deliveryPersonName: string;
  deliveryPersonEmail: string;
  orderId: number;
  groupReference?: string | null;
  deliveryFee: number;
  commissionAmount: number;
  paymentStatus: "PENDING" | "PAID";
  createdAt: string;
  paidAt?: string | null;
};

export type AdminDeliverySettings = {
  deliveryBaseFee: number;
  deliveryFeePerKm: number;
  freeDeliveryUnderKm: number;
  commissionType: "FIXED" | "DELIVERY_FEE_PERCENTAGE";
  fixedCommissionAmount: number;
  commissionPercentage: number;
};

export type AdminRestaurant = {
  id: number;
  name: string;
  brandName?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  city: string;
  address: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
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
  completedDeliveries: number;
  totalCommissionOwed: number;
  pendingCommissionTotal: number;
  paidCommissionTotal: number;
  deliveryPersonnelEarnings: AdminDeliveryPersonnelEarnings[];
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

export type WithdrawalBankOption = {
  code: string;
  name: string;
  type: "ghipss" | "mobile_money";
};

export type WithdrawalRecord = {
  id: number;
  amount: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  provider: string;
  reference: string;
  destinationType: "ghipss" | "mobile_money";
  bankCode: string;
  accountNumber: string;
  accountName: string;
  reason?: string | null;
  failureReason?: string | null;
  createdAt: string;
  processedAt?: string | null;
};

export type WithdrawalDashboard = {
  fullName: string;
  email: string;
  availableBalance: number;
  withdrawals: WithdrawalRecord[];
};

export type DeliveryLocation = {
  latitude: number;
  longitude: number;
};

export type DeliveryDashboard = {
  driverName: string;
  driverEmail: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  earnings: DeliveryEarningsSummary;
  commissions: DeliveryCommission[];
  availableOrders: Order[];
  assignedOrders: Order[];
};

export type DeliveryEarningsSummary = {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  completedDeliveries: number;
};

export type DeliveryCommission = {
  id: number;
  orderId: number;
  deliveryFee: number;
  commissionAmount: number;
  paymentStatus: "PENDING" | "PAID";
  createdAt: string;
  paidAt?: string | null;
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

export type RegisterUserRequest = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResult = {
  message: string;
  previewResetUrl?: string | null;
  expiresAt?: string | null;
};

export type CreateWithdrawalRequest = {
  amount: number;
  destinationType: "ghipss" | "mobile_money";
  bankCode: string;
  accountNumber: string;
  accountName: string;
  reason?: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type VerifyResetTokenRequest = {
  token: string;
};

export type VerifyResetTokenResult = {
  valid: boolean;
  message: string;
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

export type UpdateDeliveryCommissionStatusRequest = {
  paymentStatus: "PENDING" | "PAID";
};

export type UpdateDeliverySettingsRequest = {
  deliveryBaseFee: number;
  deliveryFeePerKm: number;
  freeDeliveryUnderKm: number;
  commissionType: "FIXED" | "DELIVERY_FEE_PERCENTAGE";
  fixedCommissionAmount: number;
  commissionPercentage: number;
};
