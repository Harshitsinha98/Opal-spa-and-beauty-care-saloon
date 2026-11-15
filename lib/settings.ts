import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "./db";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24 hour)");

export const settingsSchema = z.object({
  business: z
    .object({
      name: z.string().min(1).default("Opal Spa & Beauty Care Salon"),
      legalName: z.string().default(""),
      phone: z.string().default(""),
      whatsapp: z.string().default(""),
      email: z.string().default(""),
      instagram: z.string().default(""),
      facebook: z.string().default(""),
      address: z
        .string()
        .default(
          "Shree Tower, E7/851, opposite Railway Housing Society, E-7, Arera Colony, Bhopal, Madhya Pradesh 462016",
        ),
      mapsUrl: z.string().default("https://share.google/NNeVeRFwIDViMdOc3"),
      googleRating: z.number().min(0).max(5).default(4.8),
      googleReviewCount: z.number().int().min(0).default(98),
    })
    .prefault({}),
  hours: z
    .object({
      open: hhmm.default("11:30"),
      close: hhmm.default("21:00"),
      closedWeekdays: z.array(z.number().int().min(0).max(6)).default([]), // 0 = Sunday
      closedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
    })
    .prefault({}),
  booking: z
    .object({
      slotIntervalMin: z.number().int().min(10).max(120).default(30),
      capacityPerSlot: z.number().int().min(1).max(50).default(3),
      allowStaffSelection: z.boolean().default(false),
      advanceDays: z.number().int().min(1).max(180).default(30),
      minLeadMinutes: z.number().int().min(0).max(1440).default(60),
      holdMinutes: z.number().int().min(5).max(60).default(15),
    })
    .prefault({}),
  payments: z
    .object({
      onlineEnabled: z.boolean().default(true),
      cashEnabled: z.boolean().default(true),
    })
    .prefault({}),
  reschedule: z
    .object({
      allowCustomer: z.boolean().default(true),
      cutoffHours: z.number().min(0).max(168).default(12), // must be at least this many hours before the visit
      maxPerBooking: z.number().int().min(1).max(10).default(2),
    })
    .prefault({}),
  cancellation: z
    .object({
      allowCustomerCancel: z.boolean().default(true),
      freeWindowHours: z.number().min(0).max(168).default(24),
      feeType: z.enum(["percent", "flat"]).default("percent"),
      feeValue: z.number().min(0).default(20), // percent (0-100) or rupees
    })
    .prefault({}),
});

export type Settings = z.infer<typeof settingsSchema>;

export const getSettings = cache(async (): Promise<Settings> => {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, "main") });
  const parsed = settingsSchema.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : settingsSchema.parse({});
});

export async function saveSettings(value: Settings) {
  const clean = settingsSchema.parse(value);
  await db
    .insert(schema.settings)
    .values({ key: "main", value: clean })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: clean, updatedAt: new Date() } });
}

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Payment methods actually available to customers right now. */
export function availableMethods(s: Settings) {
  const methods: ("online" | "cash")[] = [];
  if (s.payments.onlineEnabled && razorpayConfigured()) methods.push("online");
  if (s.payments.cashEnabled) methods.push("cash");
  return methods;
}
