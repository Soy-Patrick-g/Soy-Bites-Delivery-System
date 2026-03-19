export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  vegetarian: boolean;
  spicy: boolean;
};

export type Review = {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
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
  restaurantName: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  deliveryAddress: string;
  distanceKm: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  payment?: PaymentInitialization | null;
};

export type AdminDashboard = {
  totalRestaurants: number;
  totalOrders: number;
  totalReviews: number;
  totalRevenue: number;
  topRestaurants: RestaurantSummary[];
};

export type UserRole = "USER" | "RESTAURANT" | "ADMIN";

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
