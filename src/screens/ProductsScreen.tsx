import React, { useMemo, useState } from "react";
import { PencilSimple, Plus } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Modal } from "@/src/components/ui/Modal";
import { Button, NumberField, SelectField, Switch, TextField } from "@/src/components/ui/Inputs";
import { SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import {
  addProduct,
  listProducts,
  productUsedInClosings,
  setProductActive,
  updateProduct,
} from "@/src/db/repo";
import { Product, ProductType } from "@/src/types";
import { formatRupiah } from "@/src/lib/format";

export const ProductsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const products = listProducts(true);
  const dues = useMemo(() => products.filter((p) => p.type === "DUES"), [products]);
  const priv = useMemo(() => products.filter((p) => p.type === "PRIVATE"), [products]);

  const toggle = (p: Product) => {
    setProductActive(p.id, p.active !== 1);
    setRefreshKey((k) => k + 1);
  };

  const renderGroup = (title: string, list: Product[]) => (
    <>
      <SectionTitle className="mt-4">{title}</SectionTitle>
      {list.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">Belum ada produk.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((p) => (
            <Card key={p.id} testID={`product-${p.id}`} className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p
                  className={`text-sm font-bold ${
                    p.active === 1 ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {p.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatRupiah(p.price)}
                  {p.sessions ? ` · ${p.sessions} sesi` : ""}
                </p>
              </div>
              <button
                type="button"
                data-testid={`product-edit-${p.id}`}
                onClick={() => setEditing(p)}
                aria-label="Edit produk"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <PencilSimple size={16} />
              </button>
              <Switch
                checked={p.active === 1}
                onChange={() => toggle(p)}
                testID={`product-toggle-${p.id}`}
              />
            </Card>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <Header title="Products" subtitle="Dues & Private" onBack={onBack} />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-2">
        {renderGroup("Dues Membership", dues)}
        {renderGroup("Private Training", priv)}
      </main>

      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-auto sm:left-1/2 sm:translate-x-36 z-40">
        <button
          type="button"
          data-testid="product-add-fab"
          onClick={() => setIsAdding(true)}
          aria-label="Tambah Produk Baru"
          className="w-14 h-14 rounded-full bg-[#00A3A6] hover:bg-[#008F91] text-white font-black flex items-center justify-center shadow-lg shadow-[#00A3A6]/30 active:scale-95 transition-all cursor-pointer"
          title="Tambah Produk Baru"
        >
          <Plus size={24} weight="bold" />
        </button>
      </div>

      {(isAdding || editing) && (
        <ProductEditor
          product={editing}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setIsAdding(false);
            setEditing(null);
            setRefreshKey((k) => k + 1);
            showToast("Produk tersimpan", "success");
          }}
        />
      )}
    </div>
  );
};

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [type, setType] = useState<ProductType>(product?.type ?? "DUES");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [sessions, setSessions] = useState(product?.sessions ?? 0);

  const handleSave = () => {
    if (!name.trim()) {
      showToast("Nama produk wajib diisi", "error");
      return;
    }
    if (product) {
      if (product.active !== 1 && productUsedInClosings(product.id)) {
      }
      updateProduct(product.id, name.trim(), price, type === "PRIVATE" ? sessions : null);
    } else {
      addProduct(type, name.trim(), price, type === "PRIVATE" ? sessions : null);
    }
    onSaved();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={product ? "Edit Produk" : "Produk Baru"}
      subtitle="Kelola tarif dan spesifikasi produk"
      maxWidth="md"
    >
      <div className="flex flex-col gap-3">
        {!product && (
          <SelectField
            label="Tipe Produk"
            value={type}
            options={[
              { label: "Dues Membership", value: "DUES" },
              { label: "Private Training", value: "PRIVATE" },
            ]}
            onChange={(v) => setType(v as ProductType)}
            testID="product-type"
          />
        )}
        <TextField
          label="Nama Produk"
          value={name}
          onChangeText={setName}
          placeholder="Contoh: VIP Primary"
          testID="product-name"
        />
        <NumberField
          label="Harga (Rp)"
          value={price}
          onChange={setPrice}
          placeholder="0"
          testID="product-price"
        />
        {type === "PRIVATE" && (
          <NumberField
            label="Jumlah Sesi"
            value={sessions}
            onChange={setSessions}
            placeholder="1"
            testID="product-sessions"
          />
        )}

        <div className="flex gap-2 mt-3">
          <Button title="Batal" variant="ghost" onClick={onClose} className="flex-1" testID="product-cancel" />
          <Button title="Simpan" onClick={handleSave} className="flex-1" testID="product-save" />
        </div>
      </div>
    </Modal>
  );
}
