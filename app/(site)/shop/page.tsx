import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { PageHeader } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Shop",
  description: "Oils, scrubs and skin care from Opal Spa, Bhopal. Order online and pick up from the salon in Arera Colony.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <>
      <PageHeader
        eyebrow="Shop · pickup only"
        title={
          <>
            Take your routine <em className="text-accent">home</em>
          </>
        }
        intro="Order here, pay online or at the counter, and pick up from the front desk in Arera Colony. We don't ship."
      />
      <div className="mx-auto max-w-[1280px] px-5 pb-24 md:px-8">
        {products.length === 0 ? (
          <p className="text-mute">New products are on the way.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.05}>
                <ProductCard
                  p={{ id: p.id, name: p.name, brand: p.brand, description: p.description, size: p.size, price: p.price, stock: p.stock, image: p.image, tone: p.tone }}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
