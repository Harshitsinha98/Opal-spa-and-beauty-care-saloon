"use client";

import { useState } from "react";
import { deleteCategoryAction, deleteServiceAction, saveCategoryAction, saveServiceAction } from "@/app/actions/admin";
import { durationLabel, rupees } from "@/lib/format";
import { ActionBtn, Btn, Card, Field, Modal, useFormAction } from "./ui";
import { ImagePicker } from "./ImagePicker";

type Cat = { id: number; name: string; blurb: string | null; sort: number };
type Svc = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  image: string | null;
  featured: boolean;
  active: boolean;
  sort: number;
};

export function ServicesManager({ cats, services }: { cats: Cat[]; services: Svc[] }) {
  const [editSvc, setEditSvc] = useState<Partial<Svc> | null>(null);
  const [editCat, setEditCat] = useState<Partial<Cat> | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => setEditSvc({ categoryId: cats[0]?.id, active: true, featured: false, durationMin: 60, price: 0, sort: 0, description: "" })} disabled={!cats.length}>
          + Add service
        </Btn>
        <Btn variant="ghost" onClick={() => setEditCat({ sort: cats.length })}>
          + Add category
        </Btn>
      </div>

      {cats.map((c) => {
        const list = services.filter((s) => s.categoryId === c.id);
        return (
          <Card
            key={c.id}
            title={c.name}
            action={
              <div className="flex gap-3 text-xs">
                <button className="underline" onClick={() => setEditCat(c)}>
                  Edit category
                </button>
                {list.length === 0 && (
                  <ActionBtn variant="soft" className="!px-2 !py-1 text-xs" confirm="Delete this category?" action={() => deleteCategoryAction(c.id)}>
                    Delete
                  </ActionBtn>
                )}
              </div>
            }
          >
            {list.length === 0 ? (
              <p className="text-sm text-mute">No services yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="min-w-48 flex-1">
                      <span className="font-medium">{s.name}</span>
                      {!s.active && <span className="ml-2 rounded bg-mute/15 px-1.5 py-0.5 text-[0.65rem] text-mute">Hidden</span>}
                      {s.featured && <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[0.65rem] text-gold">On home page</span>}
                      <span className="block text-xs text-mute">{durationLabel(s.durationMin)}</span>
                    </span>
                    <span className="w-24 text-right font-medium">{rupees(s.price)}</span>
                    <span className="flex gap-2">
                      <Btn variant="ghost" className="!py-1.5" onClick={() => setEditSvc(s)}>
                        Edit
                      </Btn>
                      <ActionBtn
                        variant="soft"
                        className="!py-1.5"
                        action={() => saveServiceAction({ ...s, price: s.price / 100, image: s.image ?? "", active: !s.active })}
                      >
                        {s.active ? "Hide" : "Show"}
                      </ActionBtn>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      {editSvc && <ServiceForm initial={editSvc} cats={cats} onClose={() => setEditSvc(null)} />}
      {editCat && <CategoryForm initial={editCat} onClose={() => setEditCat(null)} />}
    </div>
  );
}

function ServiceForm({ initial, cats, onClose }: { initial: Partial<Svc>; cats: Cat[]; onClose: () => void }) {
  const [v, setV] = useState({
    categoryId: String(initial.categoryId ?? cats[0]?.id ?? ""),
    name: initial.name ?? "",
    description: initial.description ?? "",
    durationMin: String(initial.durationMin ?? 60),
    price: String((initial.price ?? 0) / 100),
    image: initial.image ?? "",
    featured: initial.featured ?? false,
    active: initial.active ?? true,
    sort: String(initial.sort ?? 0),
  });
  const f = useFormAction();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title={initial.id ? "Edit service" : "New service"}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          f.run(
            () =>
              saveServiceAction({
                id: initial.id,
                categoryId: Number(v.categoryId),
                name: v.name,
                description: v.description,
                durationMin: Number(v.durationMin),
                price: Number(v.price),
                image: v.image,
                featured: v.featured,
                active: v.active,
                sort: Number(v.sort),
              }),
            onClose,
          );
        }}
      >
        <Field label="Name" className="sm:col-span-2">
          <input className="field" required value={v.name} onChange={set("name")} />
        </Field>
        <Field label="Category">
          <select className="field" value={v.categoryId} onChange={set("categoryId")}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Order" hint="Lower numbers show first">
          <input className="field" type="number" value={v.sort} onChange={set("sort")} />
        </Field>
        <Field label="Price (₹)">
          <input className="field" required inputMode="decimal" value={v.price} onChange={set("price")} />
        </Field>
        <Field label="Duration (minutes)" hint="Used to block the calendar">
          <input className="field" required type="number" min={5} max={480} value={v.durationMin} onChange={set("durationMin")} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea className="field min-h-20" maxLength={600} value={v.description} onChange={set("description")} />
        </Field>
        <Field label="Image (shows on hover in the menu)" className="sm:col-span-2">
          <ImagePicker value={v.image} onChange={(image) => setV({ ...v, image })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Bookable / visible
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} /> Show on home page
        </label>
        {f.error && <p className="text-sm text-bad sm:col-span-2">{f.error}</p>}
        <div className="flex justify-between gap-2 sm:col-span-2">
          <Btn type="submit" disabled={f.pending}>
            {f.pending ? "Saving…" : "Save"}
          </Btn>
          {initial.id && (
            <ActionBtn variant="ghost" className="text-bad" confirm="Delete this service? Past bookings keep their details." action={() => deleteServiceAction(initial.id!)} onDone={onClose}>
              Delete
            </ActionBtn>
          )}
        </div>
      </form>
    </Modal>
  );
}

function CategoryForm({ initial, onClose }: { initial: Partial<Cat>; onClose: () => void }) {
  const [name, setName] = useState(initial.name ?? "");
  const [blurb, setBlurb] = useState(initial.blurb ?? "");
  const [sort, setSort] = useState(String(initial.sort ?? 0));
  const f = useFormAction();
  return (
    <Modal open onClose={onClose} title={initial.id ? "Edit category" : "New category"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          f.run(() => saveCategoryAction({ id: initial.id, name, blurb, sort: Number(sort) }), onClose);
        }}
      >
        <Field label="Name">
          <input className="field" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Short line under the heading">
          <input className="field" value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={200} />
        </Field>
        <Field label="Order">
          <input className="field" type="number" value={sort} onChange={(e) => setSort(e.target.value)} />
        </Field>
        {f.error && <p className="text-sm text-bad">{f.error}</p>}
        <Btn type="submit" disabled={f.pending}>
          Save
        </Btn>
      </form>
    </Modal>
  );
}
