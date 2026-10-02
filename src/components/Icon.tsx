export function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
