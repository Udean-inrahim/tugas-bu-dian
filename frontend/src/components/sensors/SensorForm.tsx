import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Sensor } from "@/types";

interface Props {
  initial?: Sensor | null;
  onSubmit: (values: { sensorCode: string; name: string; location: string }) => Promise<unknown>;
  onDone: () => void;
}

export function SensorForm({ initial, onSubmit, onDone }: Props) {
  const [sensorCode, setSensorCode] = useState(initial?.sensorCode ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sensorCode.trim() || !name.trim() || !location.trim()) {
      toast.error("Semua kolom wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ sensorCode, name, location });
      toast.success(initial ? "Sensor diperbarui" : "Sensor ditambahkan");
      onDone();
    } catch {
      toast.error(initial ? "Gagal memperbarui sensor" : "Gagal menambahkan sensor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sensorCode">Sensor Code</Label>
        <Input
          id="sensorCode"
          placeholder="ST-002"
          value={sensorCode}
          onChange={(e) => setSensorCode(e.target.value)}
          disabled={Boolean(initial)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sensorName">Nama Sensor</Label>
        <Input
          id="sensorName"
          placeholder="Server Room"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Lokasi</Label>
        <Input
          id="location"
          placeholder="Building A"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}