CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"user_id" text,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"date" text NOT NULL,
	"start_min" integer NOT NULL,
	"end_min" integer NOT NULL,
	"staff_id" integer,
	"status" text NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"subtotal" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"cancellation_fee" integer DEFAULT 0 NOT NULL,
	"refund_amount" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"hold_expires_at" timestamp,
	"cancelled_at" timestamp,
	"cancelled_by" text,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "booking_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" uuid NOT NULL,
	"service_id" integer,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"duration_min" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"ref_id" uuid NOT NULL,
	"ref_code" text NOT NULL,
	"method" text NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text NOT NULL,
	"razorpay_id" text,
	"note" text,
	"recorded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"brand" text,
	"description" text DEFAULT '' NOT NULL,
	"size" text,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"image" text,
	"tone" text DEFAULT '#C9A79C' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"duration_min" integer NOT NULL,
	"price" integer NOT NULL,
	"image" text,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"blurb" text,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "service_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"user_id" text,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"status" text NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"total" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"refund_amount" integer DEFAULT 0 NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"hold_expires_at" timestamp,
	"stock_restored" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_order_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shop_order_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" integer,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"title" text DEFAULT 'Therapist' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"bookable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_item" ADD CONSTRAINT "booking_item_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_item" ADD CONSTRAINT "booking_item_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_category_id_service_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order" ADD CONSTRAINT "shop_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order_item" ADD CONSTRAINT "shop_order_item_order_id_shop_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."shop_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order_item" ADD CONSTRAINT "shop_order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_date_idx" ON "booking" USING btree ("date");--> statement-breakpoint
CREATE INDEX "booking_user_idx" ON "booking" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_rzp_order_idx" ON "booking" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "payment_ref_idx" ON "payment" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_rzp_idx" ON "payment" USING btree ("razorpay_id");--> statement-breakpoint
CREATE INDEX "service_category_idx" ON "service" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_user_idx" ON "shop_order" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_rzp_order_idx" ON "shop_order" USING btree ("razorpay_order_id");