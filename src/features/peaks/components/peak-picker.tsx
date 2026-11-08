"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Loader2, MountainSnow, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPeak, searchPeaks } from "@/features/peaks/actions";
import { MAX_PEAKS, type Peak, type PeakSelection } from "@/features/peaks/schemas";
import { reportActionError } from "@/lib/form";

// Busca en el catálogo compartido de cimas o añade una nueva. En eventos
// (`withAscents`) cada cima lleva el desnivel y los km de la ascensión.
export function PeakPicker({
  value,
  onChange,
  withAscents = false,
}: {
  value: PeakSelection[];
  onChange: (peaks: PeakSelection[]) => void;
  withAscents?: boolean;
}) {
  const t = useTranslations();
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Peak[]>([]);
  const [altitude, setAltitude] = useState<string | null>(null); // null = sin crear
  const [searching, startSearch] = useTransition();
  const [creating, startCreate] = useTransition();
  const latest = useRef("");

  const q = query.trim();
  const selected = new Set(value.map((p) => p.id));
  const visible = results.filter((p) => !selected.has(p.id));
  const exact = results.some((p) => p.name.toLowerCase() === q.toLowerCase());

  useEffect(() => {
    latest.current = q;
    if (q.length < 2) return;
    const timer = setTimeout(
      () =>
        startSearch(async () => {
          const result = await searchPeaks({ q });
          if (latest.current === q && result.ok) setResults(result.data);
        }),
      250,
    );
    return () => clearTimeout(timer);
  }, [q]);

  const add = (peak: Peak) => {
    onChange([...value, { id: peak.id, name: peak.name, altitudeM: peak.altitudeM }]);
    setQuery("");
    setResults([]);
    setAltitude(null);
  };

  const update = (peakId: string, patch: Partial<PeakSelection>) =>
    onChange(value.map((p) => (p.id === peakId ? { ...p, ...patch } : p)));

  const create = () =>
    startCreate(async () => {
      const result = await createPeak({ name: q, altitudeM: Number(altitude) });
      if (!result.ok) return reportActionError(result, t);
      add(result.data);
    });

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="bg-card divide-y overflow-hidden rounded-xl border">
          {value.map((peak) => (
            <li key={peak.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
              <MountainSnow aria-hidden className="text-cat-granite size-5 shrink-0" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{peak.name}</span>
                <span className="text-muted-foreground"> · {peak.altitudeM} m</span>
              </span>
              {withAscents && (
                <span className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    className="h-9 w-24"
                    placeholder={t("peaks.elevationShort")}
                    aria-label={`${t("peaks.elevation")} · ${peak.name}`}
                    value={peak.elevationGainM ?? ""}
                    onChange={(e) => update(peak.id, { elevationGainM: e.target.value })}
                  />
                  <Input
                    inputMode="decimal"
                    className="h-9 w-20"
                    placeholder={t("peaks.distanceShort")}
                    aria-label={`${t("peaks.distance")} · ${peak.name}`}
                    value={peak.distanceKm ?? ""}
                    onChange={(e) => update(peak.id, { distanceKm: e.target.value })}
                  />
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("peaks.remove", { name: peak.name })}
                onClick={() => onChange(value.filter((p) => p.id !== peak.id))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {value.length < MAX_PEAKS && (
        <div className="space-y-2">
          <div className="relative">
            <Search
              aria-hidden
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              className="pl-9"
              placeholder={t("peaks.search")}
              aria-label={t("peaks.search")}
              aria-controls={`${id}-results`}
              value={query}
              maxLength={60}
              onChange={(e) => {
                setQuery(e.target.value);
                setAltitude(null);
                if (e.target.value.trim().length < 2) setResults([]);
              }}
              onKeyDown={(e) => {
                // Enter elige el primer resultado en vez de enviar el formulario.
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (visible[0]) add(visible[0]);
                }
              }}
            />
            {searching && (
              <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
            )}
          </div>

          {q.length >= 2 && (
            <div id={`${id}-results`} aria-live="polite" className="space-y-1">
              {visible.map((peak) => (
                <button
                  key={peak.id}
                  type="button"
                  onClick={() => add(peak)}
                  className="hover:bg-secondary focus-visible:bg-secondary flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm outline-none"
                >
                  <MountainSnow aria-hidden className="text-muted-foreground size-4" />
                  <span className="font-medium">{peak.name}</span>
                  <span className="text-muted-foreground">
                    {peak.altitudeM} m{peak.rangeName && ` · ${peak.rangeName}`}
                  </span>
                </button>
              ))}
              {!searching && visible.length === 0 && results.length === 0 && (
                <p className="text-muted-foreground px-3 py-1 text-sm">{t("peaks.noResults")}</p>
              )}

              {!exact &&
                (altitude === null ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAltitude("")}>
                    <Plus data-icon="inline-start" />
                    {t("peaks.create", { name: q })}
                  </Button>
                ) : (
                  <div className="bg-secondary/50 flex flex-wrap items-end gap-2 rounded-lg p-3">
                    <label className="space-y-1 text-sm">
                      <span className="text-muted-foreground block">
                        {t("peaks.altitudeFor", { name: q })}
                      </span>
                      <Input
                        autoFocus
                        inputMode="numeric"
                        className="h-9 w-32"
                        placeholder="3404"
                        value={altitude}
                        onChange={(e) => setAltitude(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (altitude) create();
                          }
                        }}
                      />
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!altitude || creating}
                      onClick={create}
                    >
                      {creating && <Loader2 className="animate-spin" />}
                      {t("peaks.add")}
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
