import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Better Auth core tables (field names must match Better Auth's model) */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("customer"), // customer | staff | admin
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Salon                                                               */
/* ------------------------------------------------------------------ */

/** Single-row key/value store for admin-editable settings (see lib/settings.ts). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const serviceCategory = pgTable("service_category", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  blurb: text("blurb"),
  sort: integer("sort").notNull().default(0),
});

export const service = pgTable(
  "service",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => serviceCategory.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    durationMin: integer("duration_min").notNull(),
    price: integer("price").notNull(), // paise
    image: text("image"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("service_category_idx").on(t.categoryId)],
);

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .unique()
    .references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  title: text("title").notNull().default("Therapist"),
  active: boolean("active").notNull().default(true),
  bookable: boolean("bookable").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const booking = pgTable(
  "booking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD, salon local time (IST)
    startMin: integer("start_min").notNull(), // minutes from midnight
    endMin: integer("end_min").notNull(),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    // pending_payment | confirmed | completed | cancelled | no_show
    status: text("status").notNull(),
    paymentMethod: text("payment_method").notNull(), // online | cash
    // unpaid | paid | refunded | partially_refunded
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    subtotal: integer("subtotal").notNull(),
    amountPaid: integer("amount_paid").notNull().default(0),
    cancellationFee: integer("cancellation_fee").notNull().default(0),
    refundAmount: integer("refund_amount").notNull().default(0),
    notes: text("notes"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    holdExpiresAt: timestamp("hold_expires_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancelledBy: text("cancelled_by"), // customer | admin | system
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("booking_date_idx").on(t.date),
    index("booking_user_idx").on(t.userId),
    uniqueIndex("booking_rzp_order_idx").on(t.razorpayOrderId),
  ],
);

export const bookingItem = pgTable("booking_item", {
  id: serial("id").primaryKey(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => booking.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").references(() => service.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  durationMin: integer("duration_min").notNull(),
});

export const product = pgTable("product", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  brand: text("brand"),
  description: text("description").notNull().default(""),
  size: text("size"),
  price: integer("price").notNull(), // paise
  stock: integer("stock").notNull().default(0),
  image: text("image"),
  tone: text("tone").notNull().default("#C9A79C"), // swatch colour when no photo
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shopOrder = pgTable(
  "shop_order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    // pending_payment | placed | ready | picked_up | cancelled
    status: text("status").notNull(),
    paymentMethod: text("payment_method").notNull(), // online | cash
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    total: integer("total").notNull(),
    amountPaid: integer("amount_paid").notNull().default(0),
    refundAmount: integer("refund_amount").notNull().default(0),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    holdExpiresAt: timestamp("hold_expires_at"),
    stockRestored: boolean("stock_restored").notNull().default(false),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("order_user_idx").on(t.userId), uniqueIndex("order_rzp_order_idx").on(t.razorpayOrderId)],
);

export const shopOrderItem = pgTable("shop_order_item", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => shopOrder.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => product.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  qty: integer("qty").notNull(),
});

/** Ledger of every money movement: online captures, cash collected, refunds. */
export const payment = pgTable(
  "payment",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(), // booking | order
    refId: uuid("ref_id").notNull(),
    refCode: text("ref_code").notNull(),
    method: text("method").notNull(), // razorpay | cash
    type: text("type").notNull(), // payment | refund
    amount: integer("amount").notNull(), // paise, always positive
    status: text("status").notNull(), // success | pending | failed
    razorpayId: text("razorpay_id"), // pay_xxx or rfnd_xxx
    note: text("note"),
    recordedBy: text("recorded_by"), // user id of staff/admin, null for gateway
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("payment_ref_idx").on(t.refId), uniqueIndex("payment_rzp_idx").on(t.razorpayId)],
);

export type Booking = typeof booking.$inferSelect;
export type Service = typeof service.$inferSelect;
export type Product = typeof product.$inferSelect;
export type ShopOrder = typeof shopOrder.$inferSelect;
export type Staff = typeof staff.$inferSelect;
