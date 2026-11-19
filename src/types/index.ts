export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  image: string;
  sizes: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
};
