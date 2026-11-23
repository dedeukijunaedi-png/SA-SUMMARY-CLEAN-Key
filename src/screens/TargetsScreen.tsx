import React, { useEffect, useMemo, useState } from "react";
import { CheckSquare, Square, Package, Sparkle } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Button, MonthNavigator, NumberField } from "@/src/components/ui/Inputs";
import { KeyValue, SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import { getTarget, listLegacyTargets, listProducts, upsertTarget } from "@/src/db/repo";
import {
  calculateTargetUnitDetails,
  getSelectedTargetProducts,
  membersWithTargetCount,
  saveSelectedTargetProducts,
} from "@/src/services/calc";
import { currentYM, monthLabel } from "@/src/lib/date";
import { formatInt, formatRupiah } from "@/src/lib/format";
import { useMonthSwipe } from "@/src/lib/useMonthSwipe";
import { Product } from "@/src/types";

export const TargetsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [{ year, month }, setYM] = useState(currentYM());
  const [academy, setAcademy] = useState(0);
  const [dues, setDues] = useState(0);
  const [priv, setPriv] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const allProducts = useMemo(() => listProducts(false), []);
  const duesProducts = useMemo(() => allProducts.filter((p) => p.type === "DUES"), [allProducts]);

  useEffect(() => {
    const t = getTarget(year, month);
    const dVal = t?.dues_target ?? 0;
    const pVal = t?.private_target ?? 0;
    setDues(dVal);
    setPriv(pVal);
    setAcademy(dVal > 0 || pVal > 0 ? dVal + pVal : (t?.academy_target ?? 0));

    const prods = getSelectedTargetProducts(year, month);
    setSelectedProductIds(prods.map((p) => p.id));
  }, [year, month]);

  const count = membersWithTargetCount();
  const personalDues = count > 0 ? Math.round(dues / count) : 0;
  const personalPriv = count > 0 ? Math.round(priv / count) : 0;
  const personalTotal = personalDues + personalPriv;

  const selectedProducts = useMemo(() => {
    return selectedProductIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [selectedProductIds, allProducts]);

  const unitDetails = useMemo(() => {
    return calculateTargetUnitDetails(dues, selectedProducts);
  }, [dues, selectedProducts]);

  const handleToggleProduct = (productId: number) => {
    if (selectedProductIds.includes(productId)) {
      if (selectedProductIds.length === 1) {
        showToast("Pilih minimal 1 produk acuan untuk target unit", "info");
        return;
      }
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    } else {
      if (selectedProductIds.length >= 2) {
        setSelectedProductIds([selectedProductIds[0], productId]);
        showToast("Maksimal 2 produk. Produk ke-2 diganti.", "info");
      } else {
        setSelectedProductIds([...selectedProductIds, productId]);
      }
    }
  };

  const legacy = useMemo(() => listLegacyTargets(), []);

  const handleSave = () => {
    const totalAcad = dues + priv;
    upsertTarget(year, month, totalAcad, dues, priv);
    saveSelectedTargetProducts(selectedProductIds, year, month);
    showToast(`Target ${monthLabel(year, month)} tersimpan: Dues ${formatRupiah(dues)} · Priv ${formatRupiah(priv)}`, "success");
  };

  const swipeHandlers = useMonthSwipe({
    year,
    month,
    onChange: (y, m) => setYM({ year: y, month: m }),
  });

  return (
    <div
      className="flex flex-col min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
      {...swipeHandlers}
    >
      <Header title="Target Management" subtitle="Target Akademi & Target per SA" onBack={onBack} />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <MonthNavigator year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />

        <Card className="p-4 flex flex-col gap-3 border-teal-500/30">
          <div className="pb-2 border-b border-slate-100 dark:border-[#282A3A]">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00A3A6]" />
              Target Akademi (Dues & Private Dipisah)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Target per SA otomatis dihitung dari total target dibagi {count} anggota ber-target.
            </p>
          </div>

          <div className="bg-teal-50/50 dark:bg-[#162529]/60 p-3 rounded-xl border border-teal-200/60 dark:border-teal-900/40 flex flex-col gap-1.5">
            <NumberField
              label="Target Dues Gross (Akademi)"
              value={dues}
              onChange={(v) => {
                setDues(v);
                setAcademy(v + priv);
              }}
              testID="target-dues"
            />
            <div className="flex items-center justify-between text-xs font-bold text-[#00A3A6] dark:text-[#38D9D9] px-1 pt-1">
              <span>Target Dues per SA:</span>
              <span>{formatRupiah(personalDues)} / SA</span>
            </div>
          </div>

          <div className="bg-purple-50/50 dark:bg-[#20162B]/60 p-3 rounded-xl border border-purple-200/60 dark:border-purple-900/40 flex flex-col gap-1.5">
            <NumberField
              label="Target Private Gross (Akademi)"
              value={priv}
              onChange={(v) => {
                setPriv(v);
                setAcademy(dues + v);
              }}
              testID="target-private"
            />
            <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 px-1 pt-1">
              <span>Target Private per SA:</span>
              <span>{formatRupiah(personalPriv)} / SA</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#1E202B] border border-slate-200 dark:border-slate-800 flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
              <span className="font-semibold">Total Target Akademi:</span>
              <span className="font-black text-slate-900 dark:text-white text-sm">
                {formatRupiah(dues + priv)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Total Target per SA (Dues + Priv):</span>
              <span className="font-bold text-slate-800 dark:text-slate-300">
                {formatRupiah(personalTotal)} / SA
              </span>
            </div>
          </div>

          <Button
            title="Simpan Target Dues & Private"
            onClick={handleSave}
            testID="target-save"
            className="w-full mt-1"
          />
        </Card>

        <SectionTitle
          action={
            <span className="text-[11px] font-bold text-[#00A3A6] dark:text-[#38D9D9]">
              {selectedProductIds.length}/2 Dipilih
            </span>
          }
        >
          Pilih Produk Acuan Target Unit
        </SectionTitle>

        <Card className="p-3.5 flex flex-col gap-2.5 border-[#00A3A6]/30">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Package size={16} weight="bold" className="text-[#00A3A6] dark:text-[#38D9D9]" />
            <span>Pilih 1 atau 2 produk terdaftar untuk menghitung estimasi target unit:</span>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
            {allProducts.map((p) => {
              const isSelected = selectedProductIds.includes(p.id);
              const selectionIndex = selectedProductIds.indexOf(p.id);
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToggleProduct(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleProduct(p.id);
                    }
                  }}
                  className={`min-h-[44px] flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#00A3A6] bg-[#00A3A6]/10 dark:bg-[#00A3A6]/15 text-slate-900 dark:text-white font-bold"
                      : "border-slate-200 dark:border-[#282A3A] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSelected ? (
                      <CheckSquare size={18} weight="fill" className="text-[#00A3A6] dark:text-[#38D9D9] shrink-0" />
                    ) : (
                      <Square size={18} weight="regular" className="text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white leading-tight">{p.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.type} · {formatRupiah(p.price)}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#00A3A6] text-white shrink-0">
                      Produk #{selectionIndex + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <SectionTitle>Hasil Perhitungan Target (per SA)</SectionTitle>
        <Card className="divide-y divide-slate-100 dark:divide-[#282A3A] py-1">
          <KeyValue label="Anggota dengan target" value={`${count} orang`} />
          <KeyValue
            label="Target Dues per SA"
            value={formatRupiah(personalDues)}
            valueColor="#00A3A6"
          />
          <KeyValue
            label="Target Private per SA"
            value={formatRupiah(personalPriv)}
            valueColor="#8B5CF6"
          />
          <KeyValue
            label="Total Target per SA (Dues + Priv)"
            value={formatRupiah(personalTotal)}
            valueColor="#D97706"
          />
          <KeyValue
            label="Target Unit Dues Total (Acuan)"
            value={unitDetails.totalTargetUnit > 0 ? `${formatInt(unitDetails.totalTargetUnit)} unit` : "—"}
            valueColor="#00A3A6"
          />
          <KeyValue
            label="Target Unit Dues per Student Advisor"
            value={unitDetails.personalTargetUnit > 0 ? `${formatInt(unitDetails.personalTargetUnit)} unit / SA` : "—"}
          />
          <KeyValue
            label="Harga Rata-Rata Produk Acuan"
            value={unitDetails.avgPrice > 0 ? formatRupiah(unitDetails.avgPrice) : "-"}
          />
        </Card>

        {unitDetails.unitOptions.length > 0 && dues > 0 && (
          <Card className="p-3.5 bg-slate-50 dark:bg-[#161722] border-slate-200 dark:border-[#282A3A]">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkle size={15} weight="fill" className="text-[#00A3A6]" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Simulasi Unit per Produk Terpilih
              </span>
            </div>
            <div className="space-y-2">
              {unitDetails.unitOptions.map((opt, idx) => (
                <div key={opt.product.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-200 dark:border-[#282A3A] last:border-0">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Jika 100% {opt.product.name} ({formatRupiah(opt.product.price)}):
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {formatInt(opt.units)} unit
                  </span>
                </div>
              ))}
              {unitDetails.unitOptions.length === 2 && (
                <div className="flex justify-between items-center text-xs pt-1 font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                  <span>Rata-Rata Kombinasi 2 Produk:</span>
                  <span>{formatInt(unitDetails.totalTargetUnit)} unit</span>
                </div>
              )}
            </div>
          </Card>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 px-1 leading-relaxed">
          Target pribadi = Target Akademi ÷ jumlah anggota aktif dengan target (Student Advisor + Assistant Manager).
          Target unit dihitung otomatis berdasarkan harga produk yang Anda pilih di atas.
        </p>

        {legacy.length > 0 && (
          <>
            <SectionTitle className="mt-4">Target Lama (Import)</SectionTitle>
            <Card className="divide-y divide-[#F3F4F6] dark:divide-[#2D3748] py-1">
              {legacy.map((l: any, i: number) => (
                <div key={i} className="py-2.5 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">{l.advisor_name}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Rev {formatRupiah(l.revenue_target)} · {l.unit_target} unit · Priv {formatRupiah(l.private_target)}
                  </p>
                </div>
              ))}
            </Card>
            <p className="text-xs text-slate-500 dark:text-slate-400 px-1 leading-relaxed">
              Data target lama disimpan untuk referensi dan tidak memengaruhi perhitungan model baru.
            </p>
          </>
        )}
      </main>
    </div>
  );
};
