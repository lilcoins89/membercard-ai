"use client";

import type { CardDesign } from "@/lib/types";
import { DEFAULT_CARD_DESIGN } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";

export type CardModel = {
  organizationName: string;
  memberName: string;
  memberNumber?: string | null;
  membershipType?: string | null;
  expiration?: string | null;
  photoUrl?: string | null;
  status?: string;
  design?: CardDesign;
};

function QrPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-[3px] bg-white p-1 ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 40 40" className="size-full">
        <rect x="2" y="2" width="14" height="14" fill="#111" />
        <rect x="5" y="5" width="8" height="8" fill="#fff" />
        <rect x="7" y="7" width="4" height="4" fill="#111" />
        <rect x="24" y="2" width="14" height="14" fill="#111" />
        <rect x="27" y="5" width="8" height="8" fill="#fff" />
        <rect x="29" y="7" width="4" height="4" fill="#111" />
        <rect x="2" y="24" width="14" height="14" fill="#111" />
        <rect x="5" y="27" width="8" height="8" fill="#fff" />
        <rect x="7" y="29" width="4" height="4" fill="#111" />
        <rect x="20" y="20" width="4" height="4" fill="#111" />
        <rect x="26" y="20" width="4" height="4" fill="#111" />
        <rect x="32" y="20" width="4" height="4" fill="#111" />
        <rect x="20" y="26" width="4" height="4" fill="#111" />
        <rect x="32" y="26" width="4" height="4" fill="#111" />
        <rect x="20" y="32" width="4" height="4" fill="#111" />
        <rect x="26" y="32" width="8" height="4" fill="#111" />
      </svg>
    </div>
  );
}

export function MembershipCard({
  model,
  face = "front",
  className = "",
}: {
  model: CardModel;
  face?: "front" | "back";
  className?: string;
}) {
  const d = model.design ?? DEFAULT_CARD_DESIGN;
  const text = d.text_color || "#F4F0E8";
  const isLight = d.template === "classic" || d.template === "editorial";

  return (
    <article
      className={`cr80 relative overflow-hidden rounded-[18px] p-4 shadow-card ${className}`}
      style={{
        background: isLight
          ? d.secondary_color
          : `linear-gradient(145deg, ${d.primary_color} 0%, color-mix(in oklab, ${d.primary_color} 78%, black) 100%)`,
        color: isLight ? d.primary_color : text,
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-8 size-32 rounded-full opacity-30" style={{ background: d.accent_color }} />
      <div className="relative flex h-full flex-col">
        {face === "back" ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-medium">{model.organizationName}</p>
                <p className="mt-1 max-w-[220px] text-[9px] leading-relaxed opacity-70">{d.back_message}</p>
              </div>
              <QrPlaceholder className="size-16" />
            </div>
            <div className="mt-auto flex items-end justify-between text-[9px] opacity-70">
              <span className="font-mono tabular-nums">{model.memberNumber}</span>
              <span>Scan to verify · MemberCard</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em]">{model.organizationName}</span>
              {d.show_status !== false && (
                <span className="inline-flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.16em]">
                  <span className="size-1.5 rounded-full bg-emerald-300" />active
                </span>
              )}
            </div>
            <div className="mt-auto flex items-end gap-3">
              {d.photo_position !== "none" &&
                (model.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={model.photoUrl} alt="" className="h-16 w-14 shrink-0 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-white/20" />
                ) : (
                  <div className="grid h-16 w-14 shrink-0 place-items-center rounded-lg bg-black/10 text-sm font-medium">{initials(model.memberName)}</div>
                ))}
              <div className="min-w-0 flex-1">
                <p className="font-display text-[20px] font-medium leading-none tracking-tight">{model.memberName}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] opacity-80">{model.membershipType ?? "Member"}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    {model.memberNumber && <p className="font-mono text-[11px] tracking-wider tabular-nums">{model.memberNumber}</p>}
                    {model.expiration && <p className="mt-0.5 text-[9px] opacity-70">Valid until {formatDate(model.expiration)}</p>}
                  </div>
                  {d.qr_position !== "back" && <QrPlaceholder className="size-12" />}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
