import { AdminDashboard, Order, RestaurantDetail, RestaurantSummary } from "@/lib/types";

export const mockRestaurants: RestaurantDetail[] = [
  {
    id: 1,
    name: "Savannah Grill",
    description: "Charcoal grilled rice bowls, shawarma, and suya-inspired sides.",
    cuisine: "African Fusion",
    city: "Accra",
    address: "Oxford Street 18",
    averageRating: 4.6,
    distanceKm: 1.2,
    estimatedDeliveryFee: 716,
    latitude: 5.565,
    longitude: -0.19,
    menu: [
      {
        id: 101,
        name: "Jollof Fire Bowl",
        description: "Smoky jollof rice, grilled chicken, plantain, and pepper sauce.",
        price: 45,
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
        vegetarian: false,
        spicy: true
      },
      {
        id: 102,
        name: "Suya Fries",
        description: "Crispy fries dusted with suya spice and served with aioli.",
        price: 20,
        imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80",
        vegetarian: true,
        spicy: true
      }
    ],
    reviews: [
      {
        id: 1,
        customerName: "Ama Customer",
        rating: 5,
        comment: "Fast delivery, bold flavors, and the plantain was perfect.",
        createdAt: "2026-03-16T10:15:00Z"
      }
    ]
  },
  {
    id: 2,
    name: "Harbor Sushi Lab",
    description: "Fresh sushi platters and poke bowls for lunch and dinner rushes.",
    cuisine: "Japanese",
    city: "Accra",
    address: "Marine Drive 5",
    averageRating: 4.8,
    distanceKm: 2.1,
    estimatedDeliveryFee: 878,
    latitude: 5.55,
    longitude: -0.21,
    menu: [
      {
        id: 201,
        name: "Salmon Poke",
        description: "Marinated salmon with avocado, cucumber, and sesame rice.",
        price: 65,
        imageUrl: "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&w=1200&q=80",
        vegetarian: false,
        spicy: false
      },
      {
        id: 202,
        name: "Veggie Maki Set",
        description: "Eight-piece cucumber and avocado rolls with miso dip.",
        price: 40,
        imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
        vegetarian: true,
        spicy: false
      }
    ],
    reviews: [
      {
        id: 2,
        customerName: "Kojo Mensah",
        rating: 4,
        comment: "Fresh and neatly packed. The poke bowl travels really well.",
        createdAt: "2026-03-15T13:00:00Z"
      }
    ]
  },
  {
    id: 3,
    name: "Roma Pantry",
    description: "Comfort pasta, salads, and tiramisu for family-style dining.",
    cuisine: "Italian",
    city: "Accra",
    address: "Airport Residential 9",
    averageRating: 4.4,
    distanceKm: 4.8,
    estimatedDeliveryFee: 1364,
    latitude: 5.615,
    longitude: -0.175,
    menu: [
      {
        id: 301,
        name: "Truffle Alfredo",
        description: "Fettuccine in creamy truffle sauce with parmesan shards.",
        price: 58,
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
        vegetarian: true,
        spicy: false
      },
      {
        id: 302,
        name: "Chicken Arrabbiata",
        description: "Spicy tomato pasta with grilled chicken and basil.",
        price: 52,
        imageUrl: "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8dfb?auto=format&fit=crop&w=1200&q=80",
        vegetarian: false,
        spicy: true
      }
    ],
    reviews: [
      {
        id: 3,
        customerName: "Yaa Owusu",
        rating: 4,
        comment: "Comforting portions and creamy sauce, just a slightly longer prep time.",
        createdAt: "2026-03-14T19:10:00Z"
      }
    ]
  }
];

export const mockRestaurantSummaries: RestaurantSummary[] = mockRestaurants.map(
  ({ menu, reviews, latitude, longitude, ...restaurant }) => restaurant
);

export const mockOrder: Order = {
  id: 9001,
  restaurantName: "Savannah Grill",
  customerName: "Ama Customer",
  status: "OUT_FOR_DELIVERY",
  paymentStatus: "INITIALIZED",
  paymentReference: "FH-9001-1742286220000",
  deliveryAddress: "East Legon, Lagos Avenue 14",
  distanceKm: 1.2,
  subtotal: 65,
  deliveryFee: 716,
  total: 781,
  createdAt: "2026-03-18T08:30:00Z",
  items: [
    { id: 1, menuItemId: 101, name: "Jollof Fire Bowl", quantity: 1, unitPrice: 45, totalPrice: 45 },
    { id: 2, menuItemId: 102, name: "Suya Fries", quantity: 1, unitPrice: 20, totalPrice: 20 }
  ],
  payment: {
    provider: "PAYSTACK",
    reference: "FH-9001-1742286220000",
    authorizationUrl: "http://localhost:3000/checkout/callback?reference=FH-9001-1742286220000&mode=demo",
    simulated: true
  }
};

export const mockDashboard: AdminDashboard = {
  totalRestaurants: 3,
  totalOrders: 126,
  totalReviews: 39,
  totalRevenue: 24560,
  topRestaurants: mockRestaurantSummaries.slice().sort((a, b) => b.averageRating - a.averageRating)
};

