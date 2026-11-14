"use client";

import { useState } from "react";
import { createStaffAction, resetStaffPasswordAction, updateStaffAction } from "@/app/actions/admin";
import { Btn, Card, Field, Modal, useFormAction } from "./ui";

type S = { id: number; name: string; title: string; active: boolean; bookable: boolean; email: string | null };

export function StaffManager({ staff, staffSelection }: { staff: S[]; staffSelection: boolean }) {
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<S | null>(null);
  const [pw, setPw] = useState<S | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Btn onClick={() => setCreate(true)}>+ Add staff member</Btn>
        <p className="text-xs text-mute">
          Customers {staffSelection ? "can" : "can't"} pick a therapist when booking. Change this in Settings, under Booking.
        </p>
      </div>
      <Card>
        <ul className="divide-y divide-line">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush font-display text-plum">{s.name[0]}</span>
              <span className="min-w-40 flex-1">
                <span className="font-medium">{s.name}</span>
                {!s.active && <span className="ml-2 rounded bg-mute/15 px-1.5 py-0.5 text-[0.65rem] text-mute">Inactive</span>}
                <span className="block text-xs text-mute">
                  {s.title} · {s.email ?? "no login"}
                </span>
              </span>
              <span className="text-xs text-mute">{s.bookable ? "Shown to customers" : "Not bookable"}</span>
              <Btn variant="ghost" className="!py-1.5" onClick={() => setEdit(s)}>
                Edit
              </Btn>
              <Btn variant="soft" className="!py-1.5" onClick={() => setPw(s)}>
                Reset password
              </Btn>
            </li>
          ))}
          {staff.length === 0 && <li className="py-4 text-mute">No staff yet. Add your therapists and front desk team so they can use the staff panel.</li>}
        </ul>
      </Card>
      <p className="text-xs leading-relaxed text-mute">
        Staff sign in at <code>/sign-in</code> with the email and password you set here. In the staff panel they can see the day&rsquo;s
        bookings, mark them completed, assign therapists, record counter payments and hand over shop orders. They can&rsquo;t change
        prices, settings or refunds.
      </p>
      {create && <CreateForm onClose={() => setCreate(false)} />}
      {edit && <EditForm s={edit} onClose={() => setEdit(null)} />}
      {pw && <PasswordForm s={pw} onClose={() => setPw(null)} />}
    </div>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const [v, setV] = useState({ name: "", title: "Therapist", email: "", password: "" });
  const f = useFormAction();
  return (
    <Modal open onClose={onClose} title="Add staff member">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          f.run(() => createStaffAction(v), onClose);
        }}
      >
        <Field label="Name">
          <input className="field" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="Role / title" hint="e.g. Senior Therapist, Front Desk">
          <input className="field" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
        </Field>
        <Field label="Login email">
          <input className="field" type="email" required value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </Field>
        <Field label="Password" hint="At least 8 characters. Share it with them privately.">
          <input className="field" type="text" required minLength={8} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
        </Field>
        {f.error && <p className="text-sm text-bad">{f.error}</p>}
        <Btn type="submit" disabled={f.pending}>
          {f.pending ? "Creating…" : "Create login"}
        </Btn>
      </form>
    </Modal>
  );
}

function EditForm({ s, onClose }: { s: S; onClose: () => void }) {
  const [v, setV] = useState({ name: s.name, title: s.title, active: s.active, bookable: s.bookable });
  const f = useFormAction();
  return (
    <Modal open onClose={onClose} title={`Edit ${s.name}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          f.run(() => updateStaffAction({ id: s.id, ...v }), onClose);
        }}
      >
        <Field label="Name">
          <input className="field" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="Role / title">
          <input className="field" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Active (can sign in to the staff panel)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.bookable} onChange={(e) => setV({ ...v, bookable: e.target.checked })} /> Customers can choose this person when booking
        </label>
        {f.error && <p className="text-sm text-bad">{f.error}</p>}
        <Btn type="submit" disabled={f.pending}>
          Save
        </Btn>
      </form>
    </Modal>
  );
}

function PasswordForm({ s, onClose }: { s: S; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const f = useFormAction();
  return (
    <Modal open onClose={onClose} title={`New password for ${s.name}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          f.run(() => resetStaffPasswordAction(s.id, pw), onClose);
        }}
      >
        <Field label="New password" hint="They'll be signed out everywhere.">
          <input className="field" type="text" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        {f.error && <p className="text-sm text-bad">{f.error}</p>}
        <Btn type="submit" disabled={f.pending}>
          Set password
        </Btn>
      </form>
    </Modal>
  );
}
