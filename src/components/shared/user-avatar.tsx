import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProfileSummary } from "@/features/profiles/types";
import { cn } from "@/lib/utils";

// Color estable por usuario para las iniciales (sin foto).
const TONES = [
  "bg-cat-pine/20 text-cat-pine",
  "bg-cat-ember/20 text-accent-strong",
  "bg-cat-sky/20 text-cat-sky",
  "bg-cat-plum/20 text-cat-plum",
  "bg-cat-sunrise/25 text-foreground",
  "bg-cat-granite/20 text-cat-granite",
];

function toneFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const SIZES = {
  xs: { box: "size-6", text: "text-[0.6rem]" },
  sm: { box: "size-8", text: "text-xs" },
  md: { box: "size-10", text: "text-sm" },
  lg: { box: "size-14", text: "text-lg" },
  xl: { box: "size-24", text: "text-3xl" },
} as const;

export function UserAvatar({
  profile,
  size = "md",
  className,
}: {
  profile: Pick<ProfileSummary, "id" | "displayName" | "avatarUrl">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Avatar className={cn("bg-card", SIZES[size].box, className)}>
      {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
      <AvatarFallback className={cn("font-medium", SIZES[size].text, toneFor(profile.id))}>
        {initials(profile.displayName)}
      </AvatarFallback>
    </Avatar>
  );
}

export function AvatarStack({
  profiles,
  max = 4,
  size = "sm",
  className,
}: {
  profiles: ProfileSummary[];
  max?: number;
  size?: "xs" | "sm";
  className?: string;
}) {
  if (profiles.length === 0) return null;
  const shown = profiles.slice(0, max);
  const rest = profiles.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      {shown.map((p) => (
        <UserAvatar key={p.id} profile={p} size={size} className="ring-card ring-2 after:hidden" />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "bg-secondary text-secondary-foreground ring-card relative flex items-center justify-center rounded-full font-medium ring-2",
            SIZES[size].box,
            SIZES[size].text,
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
