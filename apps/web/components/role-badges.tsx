const ROLE_BADGE_STYLE: Record<string, string> = {
  admin: 'bg-red-600 text-white',
  moderator: 'bg-emerald-600 text-white',
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  moderator: 'Moderator',
};

export function RoleBadges({ roles }: { roles: string[] }) {
  const badgeRoles = roles.filter((role) => role in ROLE_BADGE_STYLE);
  if (badgeRoles.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {badgeRoles.map((role) => (
        <span
          key={role}
          className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${ROLE_BADGE_STYLE[role]}`}
        >
          {ROLE_LABEL[role]}
        </span>
      ))}
    </div>
  );
}
