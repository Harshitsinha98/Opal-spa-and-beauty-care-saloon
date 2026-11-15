export const BOOKING_STATUS: Record<string, { label: string; tone: string }> = {
  pending_payment: { label: "Awaiting payment", tone: "bg-warn/10 text-warn" },
  confirmed: { label: "Confirmed", tone: "bg-ok/10 text-ok" },
  completed: { label: "Completed", tone: "bg-brand/10 text-brand" },
  cancelled: { label: "Cancelled", tone: "bg-bad/10 text-bad" },
  no_show: { label: "No-show", tone: "bg-mute/15 text-mute" },
};

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  pending_payment: { label: "Awaiting payment", tone: "bg-warn/10 text-warn" },
  placed: { label: "Preparing", tone: "bg-brand/10 text-brand" },
  ready: { label: "Ready for pickup", tone: "bg-ok/10 text-ok" },
  picked_up: { label: "Picked up", tone: "bg-mute/15 text-mute" },
  cancelled: { label: "Cancelled", tone: "bg-bad/10 text-bad" },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  unpaid: { label: "Unpaid", tone: "bg-warn/10 text-warn" },
  paid: { label: "Paid", tone: "bg-ok/10 text-ok" },
  refunded: { label: "Refunded", tone: "bg-mute/15 text-mute" },
  partially_refunded: { label: "Part refunded", tone: "bg-mute/15 text-mute" },
};

export function Badge({ map, value }: { map: Record<string, { label: string; tone: string }>; value: string }) {
  const m = map[value] ?? { label: value, tone: "bg-mute/10 text-mute" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide ${m.tone}`}>{m.label}</span>;
}
