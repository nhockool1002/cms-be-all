export function Avatar({
  username,
  size = 16,
}: {
  username: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-sky-700 font-bold text-white"
      style={{ width: `${size * 0.25}rem`, height: `${size * 0.25}rem`, fontSize: `${size * 0.075}rem` }}
    >
      {username.slice(0, 1).toUpperCase()}
    </div>
  );
}
