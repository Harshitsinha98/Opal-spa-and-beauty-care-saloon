"use client";

import { useState } from "react";
import { deleteProductAction, saveProductAction } from "@/app/actions/admin";
import { rupees } from "@/lib/format";
import { ActionBtn, Btn, Card, Field, Modal, useFormAction } from "./ui";
import { ImagePicker } from "./ImagePicker";
import { ProductSwatch } from "../shop/ProductSwatch";

type P = {
  id: number;
  name: string;
  brand: string | null;
  description: string;
  size: string | null;
  price: number;
  stock: number;
  image: string | null;
  tone: string;
  active: boolean;
  sort: number;
};

export function ProductsManager({ products }: { products: P[] }) {
  const [edit, setEdit] = useState<Partial<P> | null>(null);
  return (
    <div className="space-y-4">
      <Btn onClick={() => setEdit({ active: true, stock: 10, price: 0, tone: "#C9A79C", sort: products.length })}>+ Add product</Btn>
      <Card>
        <ul className="divide-y divide-line">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 py-3 text-sm">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded bg-ivory">
                <ProductSwatch name={p.name} tone={p.tone} image={p.image} small />
              </div>
              <span className="min-w-40 flex-1">
                <span className="font-medium">{p.name}</span>
                {!p.active && <span className="ml-2 rounded bg-mute/15 px-1.5 py-0.5 text-[0.65rem] text-mute">Hidden</span>}
                <span className="block text-xs text-mute">
                  {[p.brand, p.size].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className={`w-24 text-xs ${p.stock <= 3 ? "text-bad" : "text-mute"}`}>{p.stock} in stock</span>
              <span className="w-20 text-right font-medium">{rupees(p.price)}</span>
              <Btn variant="ghost" className="!py-1.5" onClick={() => setEdit(p)}>
                Edit
              </Btn>
            </li>
          ))}
          {products.length === 0 && <li className="py-4 text-mute">No products yet.</li>}
        </ul>
      </Card>
      {edit && <ProductForm initial={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function ProductForm({ initial, onClose }: { initial: Partial<P>; onClose: () => void }) {
  const [v, setV] = useState({
    name: initial.name ?? "",
    brand: initial.brand ?? "",
    description: initial.description ?? "",
    size: initial.size ?? "",
    price: String((initial.price ?? 0) / 100),
    stock: String(initial.stock ?? 0),
    image: initial.image ?? "",
    tone: initial.tone ?? "#C9A79C",
    active: initial.active ?? true,
    sort: String(initial.sort ?? 0),
  });
  const f = useFormAction();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title={initial.id ? "Edit product" : "New product"}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          f.run(
            () =>
              saveProductAction({
                id: initial.id,
                name: v.name,
                brand: v.brand,
                description: v.description,
                size: v.size,
                price: Number(v.price),
                stock: Number(v.stock),
                image: v.image,
                tone: v.tone,
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
        <Field label="Brand / line">
          <input className="field" value={v.brand} onChange={set("brand")} />
        </Field>
        <Field label="Size" hint="e.g. 100 ml">
          <input className="field" value={v.size} onChange={set("size")} />
        </Field>
        <Field label="Price (₹)">
          <input className="field" required inputMode="decimal" value={v.price} onChange={set("price")} />
        </Field>
        <Field label="Stock">
          <input className="field" required type="number" min={0} value={v.stock} onChange={set("stock")} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea className="field min-h-20" value={v.description} onChange={set("description")} maxLength={800} />
        </Field>
        <Field label="Photo" className="sm:col-span-2" hint="Without a photo, the shop draws a bottle in the colour below.">
          <ImagePicker value={v.image} onChange={(image) => setV({ ...v, image })} />
        </Field>
        <Field label="Colour">
          <input className="h-10 w-full cursor-pointer rounded border border-line" type="color" value={v.tone} onChange={set("tone")} />
        </Field>
        <Field label="Order">
          <input className="field" type="number" value={v.sort} onChange={set("sort")} />
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Visible in shop
        </label>
        {f.error && <p className="text-sm text-bad sm:col-span-2">{f.error}</p>}
        <div className="flex justify-between sm:col-span-2">
          <Btn type="submit" disabled={f.pending}>
            {f.pending ? "Saving…" : "Save"}
          </Btn>
          {initial.id && (
            <ActionBtn variant="ghost" className="text-bad" confirm="Delete this product?" action={() => deleteProductAction(initial.id!)} onDone={onClose}>
              Delete
            </ActionBtn>
          )}
        </div>
      </form>
    </Modal>
  );
}
