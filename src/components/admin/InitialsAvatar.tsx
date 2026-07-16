/**
 * A deterministic avatar: initials on a colored disc whose hue is derived from
 * the person's name/email, so the same user always gets the same color.
 */
export function InitialsAvatar({
  name,
  email,
  size = 36,
}: {
  name?: string | null;
  email?: string | null;
  size?: number;
}) {
  const label = (name || email || "?").trim();
  const parts = label.split(/\s+/).filter(Boolean);
  const initials =
    (parts.length >= 2
      ? parts[0][0] + parts[1][0]
      : label.slice(0, 2)
    ).toUpperCase() || "?";

  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 60% 48%), hsl(${(hue + 30) % 360} 62% 40%))`,
      }}
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900"
    >
      {initials}
    </span>
  );
}
