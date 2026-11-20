import React, { useState } from "react";
import { PencilSimple, Plus } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Modal } from "@/src/components/ui/Modal";
import { Button, SelectField, Switch, TextField } from "@/src/components/ui/Inputs";
import { useToast } from "@/src/components/ui/Toast";
import { addMember, listTeam, setMemberActive, updateMember } from "@/src/db/repo";
import { Position, POSITIONS, positionHasTarget, TeamMember } from "@/src/types";

export const TeamScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const team = listTeam(true);

  const toggle = (m: TeamMember) => {
    setMemberActive(m.id, m.active !== 1);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Team" subtitle="Anggota & status aktif" onBack={onBack} />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-2.5">
        {team.map((m) => (
          <Card key={m.id} testID={`team-${m.id}`} className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex-1">
              <h4
                className={`text-sm font-bold ${
                  m.active === 1 ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {m.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {m.position} {m.has_target === 1 ? "· punya target" : "· tanpa target pribadi"}
              </p>
            </div>
            <button
              type="button"
              data-testid={`team-edit-${m.id}`}
              onClick={() => setEditing(m)}
              className="p-2 rounded-xl bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <PencilSimple size={16} />
            </button>
            <Switch
              checked={m.active === 1}
              onChange={() => toggle(m)}
              testID={`team-toggle-${m.id}`}
            />
          </Card>
        ))}

        <p className="text-xs text-slate-400 dark:text-slate-500 px-1 mt-2 leading-relaxed">
          Anggota nonaktif tidak muncul pada input harian baru, namun histori datanya tetap tersimpan.
        </p>
      </main>

      <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-36 z-40">
        <button
          type="button"
          data-testid="team-add-fab"
          onClick={() => setIsAdding(true)}
          className="w-13 h-13 rounded-full bg-[#00A3A6] hover:bg-[#008F91] text-white font-black flex items-center justify-center shadow-lg shadow-[#00A3A6]/30 active:scale-95 transition-all cursor-pointer"
          title="Tambah Anggota Baru"
        >
          <Plus size={24} weight="bold" />
        </button>
      </div>

      {(isAdding || editing) && (
        <MemberEditor
          member={editing}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setIsAdding(false);
            setEditing(null);
            setRefreshKey((k) => k + 1);
            showToast("Anggota tersimpan", "success");
          }}
        />
      )}
    </div>
  );
};

function MemberEditor({
  member,
  onClose,
  onSaved,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(member?.name ?? "");
  const [position, setPosition] = useState<Position>((member?.position as Position) ?? "Student Advisor");
  const [hasTarget, setHasTarget] = useState(member ? member.has_target === 1 : true);

  const onPosition = (p: Position) => {
    setPosition(p);
    setHasTarget(positionHasTarget(p));
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast("Nama wajib diisi", "error");
      return;
    }
    if (member) updateMember(member.id, name.trim(), position, hasTarget);
    else addMember(name.trim(), position, hasTarget);
    onSaved();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={member ? "Edit Anggota" : "Anggota Baru"}
      subtitle="Kelola profil tim dan target"
      maxWidth="md"
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="Nama"
          value={name}
          onChangeText={setName}
          placeholder="Contoh: Eric"
          testID="member-name"
        />
        <SelectField
          label="Posisi"
          value={position}
          options={POSITIONS.map((p) => ({ label: p, value: p }))}
          onChange={(v) => onPosition(v as Position)}
          testID="member-position"
        />

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#16263C]/30 border border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Memiliki target pribadi
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Manager biasanya tidak memiliki target pribadi
            </p>
          </div>
          <Switch
            checked={hasTarget}
            onChange={setHasTarget}
            testID="member-hastarget"
          />
        </div>

        <div className="flex gap-2 mt-3">
          <Button title="Batal" variant="ghost" onClick={onClose} className="flex-1" testID="member-cancel" />
          <Button title="Simpan" onClick={handleSave} className="flex-1" testID="member-save" />
        </div>
      </div>
    </Modal>
  );
}
