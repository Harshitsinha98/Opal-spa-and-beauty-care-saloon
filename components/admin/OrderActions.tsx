"use client";

import { useState } from "react";
import { adminCancelOrderAction, setOrderStatusAction } from "@/app/actions/admin";
import { rupees } from "@/lib/format";
import { ActionBtn, Btn, Field, Modal, useFormAction } from "./ui";
import { CashModal } from "./BookingActions";

type O = { id: string; status: string; paymentStatus: string; due: number; refundable: number; paymentMethod: string };

export function OrderActions({ o, role }: { o: O; role: "admin" | "staff" }) {
  const [cash, setCash] = useState(false);
  const [cancel, setCancel] = useState(false);
  if (o.status === "cancelled" || o.status === "pending_payment" || o.status === "picked_up")
    return <span className="text-xs text-mute">{o.status === "pending_payment" ? "Awaiting online payment" : "No actions"}</span>;
  return (
    <div className="flex flex-wrap items-start gap-2">
      {o.status === "placed" && (
        <ActionBtn variant="ghost" action={() => setOrderStatusAction(o.id, "ready")}>
          Mark ready
        </ActionBtn>
      )}
      {o.due > 0 && <Btn variant="soft" onClick={() => setCash(true)}>Record payment</Btn>}
      {o.due === 0 && (
        <ActionBtn action={() => setOrderStatusAction(o.id, "picked_up")} confirm="Hand over this order?">
          Handed over
        </ActionBtn>
      )}
      {role === "admin" && (
        <Btn variant="ghost" className="text-bad" onClick={() => setCancel(true)}>
          Cancel
        </Btn>
      )}
      <CashModal open={cash} onClose={() => setCash(false)} kind="order" id={o.id} due={o.due} />
      {role === "admin" && <CancelOrder open={cancel} onClose={() => setCancel(false)} o={o} />}
    </div>
  );
}

function CancelOrder({ open, onClose, o }: { open: boolean; onClose: () => void; o: O }) {
  const [refund, setRefund] = useState(String(o.refundable / 100));
  const [reason, setReason] = useState("");
  const f = useFormAction();
  return (
    <Modal open={open} onClose={onClose} title="Cancel order">
      <div className="space-y-4 text-sm">
        <p>Stock goes back on the shelf automatically.</p>
        {o.refundable > 0 && (
          <Field label={`Refund (₹), paid ${rupees(o.refundable)}${o.paymentMethod === "online" ? " via Razorpay" : " at counter"}`}>
            <input className="field" value={refund} onChange={(e) => setRefund(e.target.value)} inputMode="decimal" />
          </Field>
        )}
        <Field label="Reason">
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        </Field>
        {f.error && <p className="text-bad">{f.error}</p>}
        <Btn variant="danger" disabled={f.pending} onClick={() => f.run(() => adminCancelOrderAction(o.id, Number(refund) || 0, reason), onClose)}>
          Cancel order
        </Btn>
      </div>
    </Modal>
  );
}
