"use client";

import { Carousel } from "../ui/Carousel";
import { ProductCard, type ProductCardData } from "../shop/ProductCard";

export function ProductsCarousel({ products }: { products: ProductCardData[] }) {
  return <Carousel label="Shop products">{products.map((p) => <ProductCard key={p.id} p={p} />)}</Carousel>;
}
