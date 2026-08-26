export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-mark brand-mark--compact" : "brand-mark"}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="19" className="brand-mark__rim" />
        <path
          d="M20.5 10.5a11.8 11.8 0 0 0 0 23v-6.1a5.9 5.9 0 0 1 0-10.8z"
          className="brand-mark__token"
        />
        <path
          d="M23.5 10.5v6.1a5.9 5.9 0 0 1 0 10.8v6.1a11.8 11.8 0 0 0 0-23z"
          className="brand-mark__lp"
        />
      </svg>
    </span>
  );
}
