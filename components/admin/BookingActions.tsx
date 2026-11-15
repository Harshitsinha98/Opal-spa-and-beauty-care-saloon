"use client";

import { useEffect, useState } from "react";
import {
  adminCancelBookingAction,
  adminSlotsAction,
  assignStaffAction,
  quoteCancellationAction,
  recordCashAction,
  rescheduleBookingAction,
  setBookingStatusAction,
} from "@/app/actions/admin";
import { minutesToLabel, rupees } from "@/lib/format";
import { ActionBtn, Btn, Card, Field, Modal, useFormAction } from "./ui";

type B = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  staffId: number | null;
  date: string;
  startMin: number;
  due: number;
  refundable: number;
};

export function BookingActions({ b, staff, role }: { b: B; staff: { id: number; name: string }[]; role: "admin" | "staff" }) {
  const [cash, setCash] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [move, setMove] = useState(false);
  const live = b.status === "confirmed" || b.status === "completed";

  return (
    <div className="space-y-4">
      <Card title="Status">
        {b.status === "pending_payment" && <p className="text-sm text-mute">Waiting for the guest to finish paying online. The hold expires on its own.</p>}
        {b.status === "cancelled" && <p className="text-sm text-mute">This booking is cancelled.</p>}
        {live && (
          <div className="flex flex-wrap gap-2">
            {b.status !== "completed" && (
              <ActionBtn action={() => setBookingStatusAction(b.id, "completed")}>Mark completed</ActionBtn>
            )}
            {b.status !== "confirmed" && (
              <ActionBtn variant="ghost" action={() => setBookingStatusAction(b.id, "confirmed")}>
                Back to confirmed
              </ActionBtn>
            )}
            <ActionBtn variant="ghost" confirm="Mark this guest as a no-show?" action={() => setBookingStatusAction(b.id, "no_show")}>
              No-show
            </ActionBtn>
          </div>
        )}
        {b.status === "no_show" && (
          <ActionBtn variant="ghost" action={() => setBookingStatusAction(b.id, "confirmed")}>
            Undo no-show
          </ActionBtn>
        )}
      </Card>

      {b.status !== "cancelled" && (
        <Card title="Therapist">
          <AssignStaff id={b.id} current={b.staffId} staff={staff} />
        </Card>
      )}

      {b.status !== "cancelled" && b.status !== "pending_payment" && (
        <Card title="Payment">
          {b.due > 0 ? (
            <>
              <p className="text-sm">
                Due: <strong>{rupees(b.due)}</strong>
              </p>
              <Btn className="mt-3" onClick={() => setCash(true)}>
                Record payment at counter
              </Btn>
            </>
          ) : (
            <p className="text-sm text-ok">Fully paid.</p>
          )}
        </Card>
      )}

      {role === "admin" && b.status === "confirmed" && (
        <Card title="Change or cancel">
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" onClick={() => setMove(true)}>
              Reschedule
            </Btn>
            <Btn variant="danger" onClick={() => setCancel(true)}>
              Cancel booking
            </Btn>
          </div>
        </Card>
      )}
      {role === "admin" && (b.status === "completed" || b.status === "no_show") && b.refundable > 0 && (
        <Card title="Refund">
          <Btn variant="danger" onClick={() => setCancel(true)}>
            Cancel &amp; refund
          </Btn>
        </Card>
      )}

      <CashModal open={cash} onClose={() => setCash(false)} kind="booking" id={b.id} due={b.due} />
      {role === "admin" && <CancelModal open={cancel} onClose={() => setCancel(false)} b={b} />}
      {role === "admin" && <MoveModal open={move} onClose={() => setMove(false)} b={b} />}
    </div>
  );
}

function AssignStaff({ id, current, staff }: { id: string; current: number | null; staff: { id: number; name: string }[] }) {
  const [val, setVal] = useState(current ? String(current) : "");
  const f = useFormAction();
  return (
    <div className="flex gap-2">
      <select className="field text-sm" value={val} onChange={(e) => setVal(e.target.value)}>
        <option value="">Not assigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <Btn disabled={f.pending || val === (current ? String(current) : "")} onClick={() => f.run(() => assignStaffAction(id, val ? Number(val) : null))}>
        Save
      </Btn>
      {f.error && <p className="text-xs text-bad">{f.error}</p>}
    </div>
  );
}

export function CashModal({ open, onClose, kind, id, due }: { open: boolean; onClose: () => void; kind: "booking" | "order"; id: string; due: number }) {
  const [amount, setAmount] = useState(String(due / 100));
  const [note, setNote] = useState("");
  const f = useFormAction();
  return (
    <Modal open={open} onClose={onClose} title="Record payment">
      <div className="space-y-4">
        <Field label="Amount received (₹)">
          <input className="field" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Note" hint="e.g. Cash, UPI to salon QR, card machine">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
        </Field>
        {f.error && <p className="text-sm text-bad">{f.error}</p>}
        <Btn disabled={f.pending} onClick={() => f.run(() => recordCashAction(kind, id, Number(amount), note), onClose)}>
          {f.pending ? "Saving…" : "Save payment"}
        </Btn>
      </div>
    </Modal>
  );
}

function CancelModal({ open, onClose, b }: { open: boolean; onClose: () => void; b: B }) {
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof quoteCancellationAction>>>(null);
  const [refund, setRefund] = useState("0");
  const [reason, setReason] = useState("");
  const f = useFormAction();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    quoteCancellationAction(b.id).then((q) => {
      if (!alive) return;
      setQuote(q);
      setRefund(String((q?.refund ?? 0) / 100));
    });
    return () => {
      alive = false;
    };
  }, [open, b.id]);

  return (
    <Modal open={open} onClose={onClose} title="Cancel booking">
      <div className="space-y-4 text-sm">
        {b.refundable > 0 ? (
          <>
            <p>
              Paid so far: <strong>{rupees(b.refundable)}</strong>
              {b.paymentMethod === "online" ? " (refund goes back through Razorpay)" : " (refund at the counter)"}
            </p>
            {quote && (
              <p className="rounded-md bg-ivory p-3 text-xs">
                Policy suggests: {quote.free ? "no fee (outside the fee window)" : `fee ${rupees(quote.fee)}`}, so refund {rupees(quote.refund)}.
                You can change the amount below, e.g. to waive the fee.
              </p>
            )}
            <Field label="Refund amount (₹)">
              <input className="field" inputMode="decimal" value={refund} onChange={(e) => setRefund(e.target.value)} />
            </Field>
            <div className="flex gap-2 text-xs">
              <button className="underline" onClick={() => setRefund(String(b.refundable / 100))}>
                Full refund
              </button>
              <button className="underline" onClick={() => setRefund("0")}>
                No refund
              </button>
            </div>
          </>
        ) : (
          <p>Nothing has been paid, so there&rsquo;s nothing to refund.</p>
        )}
        <Field label="Reason (shown to the guest)">
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Therapist unwell" />
        </Field>
        {f.error && <p className="text-bad">{f.error}</p>}
        <Btn variant="danger" disabled={f.pending} onClick={() => f.run(() => adminCancelBookingAction(b.id, Number(refund) || 0, reason), onClose)}>
          {f.pending ? "Cancelling…" : "Cancel booking"}
        </Btn>
      </div>
    </Modal>
  );
}

function MoveModal({ open, onClose, b }: { open: boolean; onClose: () => void; b: B }) {
  const [date, setDate] = useState(b.date);
  const [slots, setSlots] = useState<{ start: number; available: boolean }[] | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const f = useFormAction();
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setSlots(null);
    setSlot(null);
    adminSlotsAction(b.id, date).then((r) => alive && setSlots(r));
    return () => {
      alive = false;
    };
  }, [open, date, b.id]);
  const load = (d: string) => setDate(d);
  return (
    <Modal open={open} onClose={onClose} title="Reschedule">
      <div className="space-y-4">
        <Field label="New date">
          <input type="date" className="field" value={date} onChange={(e) => load(e.target.value)} />
        </Field>
        <div className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto">
          {slots === null && <p className="col-span-4 text-sm text-mute">Loading…</p>}
          {slots?.length === 0 && <p className="col-span-4 text-sm text-mute">No times on this day.</p>}
          {slots?.map((s) => (
            <button
              key={s.start}
              disabled={!s.available}
              onClick={() => setSlot(s.start)}
              className={`rounded border px-1 py-2 text-xs ${slot === s.start ? "border-brand bg-brand text-paper" : s.available ? "border-line" : "border-line text-mute/40 line-through"}`}
            >
              {minutesToLabel(s.start)}
            </button>
          ))}
        </div>
        {f.error && <p className="text-sm text-bad">{f.error}</p>}
        <Btn disabled={slot === null || f.pending} onClick={() => slot !== null && f.run(() => rescheduleBookingAction(b.id, date, slot), onClose)}>
          Move booking
        </Btn>
      </div>
    </Modal>
  );
}
