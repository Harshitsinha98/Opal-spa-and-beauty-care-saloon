/**
 * Idempotent seed. Safe to run on every deploy:
 *  - creates default settings if missing
 *  - inserts demo categories/services/products only when those tables are empty
 *  - creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if that user doesn't exist
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import crypto from "node:crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql as dsql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import * as schema from "../lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema });

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Demo menu. Prices are placeholders the salon edits from Admin > Services.
const MENU: { name: string; blurb: string; items: [string, number, number, string, boolean?, string?][] }[] = [
  {
    name: "Massage",
    blurb: "Full-body and focused work in a private room.",
    items: [
      ["Swedish Massage", 60, 1999, "Long, flowing strokes with warm oil. A good first massage if you're not sure what to choose.", true, "/media/room-buddha.webp"],
      ["Deep Tissue Massage", 60, 2499, "Slower, firmer pressure for tight shoulders, back and legs. Tell your therapist where it hurts.", true, "/media/room-wine.webp"],
      ["Balinese Massage", 75, 2799, "Stretching, palm pressure and acupressure points, finished with long oil strokes.", false, "/media/room-drapes.webp"],
      ["Aromatherapy Massage", 60, 2299, "Light to medium pressure with an essential-oil blend you pick before the session.", true, "/media/room-rose.webp"],
      ["Head, Neck & Shoulder", 30, 999, "Thirty minutes on the places that carry screen time and long drives.", false],
      ["Foot Reflexology", 45, 1299, "Pressure-point work on the feet and lower legs, with a warm towel finish.", false],
    ],
  },
  {
    name: "Body Rituals",
    blurb: "Scrubs and wraps to leave skin soft.",
    items: [
      ["Coffee Body Scrub", 45, 1799, "Ground coffee and coconut oil to buff away dry skin, followed by a warm rinse.", false],
      ["Body Polishing", 60, 2499, "Exfoliation, a nourishing pack and moisturiser. Popular before weddings and events.", true, "/media/room-soft.webp"],
      ["Potli Massage", 75, 2999, "Warm herbal pouches pressed along the back and limbs, followed by an oil massage.", false],
    ],
  },
  {
    name: "Skin",
    blurb: "Facials and clean-ups for everyday skin.",
    items: [
      ["Classic Clean-up", 45, 799, "Cleanse, steam, gentle extraction and a calming mask.", false],
      ["Hydrating Facial", 60, 1999, "For dull or dry skin. Layers of moisture, a massage and a sheet mask.", true, "/media/reception-mirror.webp"],
      ["De-tan Treatment", 30, 699, "Face and neck pack to lift sun tan.", false],
    ],
  },
  {
    name: "Hair",
    blurb: "Cuts, care and styling.",
    items: [
      ["Haircut & Styling", 45, 599, "Consultation, wash, cut and blow-dry.", false],
      ["Hair Spa", 60, 1299, "Scalp massage, steam and a deep-conditioning mask.", false],
      ["Blow-dry", 30, 499, "Wash and blow-dry, straight or with volume.", false],
    ],
  },
  {
    name: "Hands, Feet & Grooming",
    blurb: "The small things, done properly.",
    items: [
      ["Classic Manicure", 40, 599, "Shape, cuticle care, hand massage and polish.", false],
      ["Spa Pedicure", 50, 799, "Soak, scrub, callus care, massage and polish.", false],
      ["Eyebrow Threading", 10, 80, "Shape and clean-up.", false],
      ["Full Arms Waxing", 30, 399, "Rica or regular wax.", false],
    ],
  },
];

const PRODUCTS: [string, string, string, number, number, string, string][] = [
  ["Aroma Massage Oil", "Opal Rituals", "Sesame and almond base with lavender and orange. For body massage at home.", 650, 20, "100 ml", "#B98F7B"],
  ["Kumkumadi Face Oil", "Ayurvedic", "Saffron face oil for night use. Two to three drops on clean skin.", 899, 15, "30 ml", "#C48A5E"],
  ["Coffee Body Scrub", "Opal Rituals", "Ground coffee in coconut oil. Use on damp skin, twice a week.", 499, 18, "200 g", "#6E4B3A"],
  ["Hair Spa Mask", "Salon care", "Deep-conditioning mask for dry or coloured hair. Leave on for 15 minutes.", 549, 12, "250 g", "#C9A79C"],
  ["Daily Sunscreen SPF 50", "Skin care", "Light gel sunscreen that doesn't leave a white cast.", 449, 25, "50 g", "#D8C3A5"],
];

async function main() {
  const existing = await db.query.settings.findFirst({ where: eq(schema.settings.key, "main") });
  if (!existing) {
    await db.insert(schema.settings).values({ key: "main", value: {} });
    console.log("settings: created defaults");
  }

  const [{ n: catCount }] = await db.select({ n: dsql<number>`count(*)::int` }).from(schema.serviceCategory);
  if (catCount === 0) {
    let ci = 0;
    for (const cat of MENU) {
      const [c] = await db
        .insert(schema.serviceCategory)
        .values({ name: cat.name, slug: slug(cat.name), blurb: cat.blurb, sort: ci++ })
        .returning();
      let si = 0;
      for (const [name, duration, price, description, featured, image] of cat.items) {
        await db.insert(schema.service).values({
          categoryId: c.id,
          name,
          slug: slug(name),
          description,
          durationMin: duration,
          price: price * 100,
          featured: Boolean(featured),
          image: image ?? null,
          sort: si++,
        });
      }
    }
    console.log("services: inserted demo menu");
  }

  const [{ n: prodCount }] = await db.select({ n: dsql<number>`count(*)::int` }).from(schema.product);
  if (prodCount === 0) {
    let i = 0;
    for (const [name, brand, description, price, stock, size, tone] of PRODUCTS) {
      await db.insert(schema.product).values({ name, slug: slug(name), brand, description, price: price * 100, stock, size, tone, sort: i++ });
    }
    console.log("products: inserted demo products");
  }

  // ADMIN_EMAIL can be one email or a comma-separated list.
  const emails = (process.env.ADMIN_EMAIL ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const password = process.env.ADMIN_PASSWORD;
  if (!emails.length) console.log("admin: ADMIN_EMAIL not set, skipped");
  for (const email of emails) {
    const u = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
    if (u) {
      if (u.role !== "admin") {
        await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.id, u.id));
        console.log(`admin: promoted ${email}`);
      }
      continue;
    }
    if (!password) {
      console.log(`admin: ${email} will become admin on first Google sign-in (no ADMIN_PASSWORD set)`);
      continue;
    }
    if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");
    const id = crypto.randomUUID();
    await db.insert(schema.user).values({ id, name: "Salon Admin", email, emailVerified: true, role: "admin" });
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(password),
    });
    console.log(`admin: created ${email}`);
  }
}

main()
  .then(() => client.end())
  .catch(async (e) => {
    console.error(e);
    await client.end();
    process.exit(1);
  });
