import { getSettings } from "@/lib/settings";
import { hoursText } from "@/lib/format";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartProvider } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Cursor } from "@/components/motion/Cursor";
import { Preloader } from "@/components/motion/Preloader";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { LocalBusinessJsonLd } from "@/components/site/JsonLd";

export const revalidate = 3600;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <MotionRoot>
      <CartProvider>
        <div className="grain">
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:bg-paper focus:px-4 focus:py-2">
            Skip to content
          </a>
          <Preloader />
          <SmoothScroll />
          <Cursor />
          <Header phone={s.business.phone} hours={hoursText(s.hours)} />
          <main id="main">{children}</main>
          <Footer s={s} />
          <CartDrawer />
          <LocalBusinessJsonLd s={s} />
        </div>
      </CartProvider>
    </MotionRoot>
  );
}
