import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { PageHeader } from "@/components/site/PageHeader";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Shop",
  description: "Oils, scrubs and skin care used at Opal Spa, Bhopal. Order online and pick up from the salon in Arera Colony.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <>
      <PageHeader
        eyebrow="Shop · pickup only"
        lines={["Take a little", <em key="h" className="text-wine">home</em>]}
        intro="Products from our rooms, for use between visits. Order here, pay online or at the counter, and pick up from the front desk in Arera Colony. We don't ship."
      />
      <div className="mx-auto max-w-[1440px] px-5 pb-36 md:px-10">
        <ProductGrid
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            description: p.description,
            size: p.size,
            price: p.price,
            stock: p.stock,
            image: p.image,
            tone: p.tone,
          }))}
        />
      </div>
    </>
  );
}
