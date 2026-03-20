export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
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
  description: string;
  cuisine: string;
  city: string;
  address: string;
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

export type AdminDashboard = {
  totalRestaurants: number;
  totalOrders: number;
  totalReviews: number;
  totalRevenue: number;
  totalOwnerAllocations: number;
  topRestaurants: RestaurantSummary[];
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
