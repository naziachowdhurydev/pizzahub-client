export type PaymentMethod = "stripe" | "cod" | "wallet";

export type PaymentOrderItem = {
  itemId: string;
  name: string;
  size: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type PaymentOrderDetails = {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  deliveryAddress: string;
  status: string;
  createdAt?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: PaymentOrderItem[];
};
