import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markRefundStatus, settleRazorpayPayment } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Entity = { id: string; order_id?: string; amount?: number; status?: string };

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: { payment?: { entity: Entity }; refund?: { entity: Entity }; order?: { entity: Entity } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "payment.captured":
      case "order.paid": {
        const p = event.payload.payment?.entity;
        if (p?.order_id && p.status === "captured") await settleRazorpayPayment(p.order_id, p.id, Number(p.amount));
        break;
      }
      case "refund.processed": {
        const r = event.payload.refund?.entity;
        if (r) await markRefundStatus(r.id, "success");
        break;
      }
      case "refund.failed": {
        const r = event.payload.refund?.entity;
        if (r) await markRefundStatus(r.id, "failed");
        break;
      }
      default:
        break; // payment.failed etc: the hold simply expires.
    }
  } catch (err) {
    console.error("razorpay webhook", event.event, err);
    // 500 makes Razorpay retry later.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
