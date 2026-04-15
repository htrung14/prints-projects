export default function Footer() {
  return (
    <footer className="border-t border-[var(--ink-line)] px-6 py-6 text-xs md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Brooklyn Prints — demo build</span>
        <span className="text-[var(--ink-faint)]">Made to order in Brooklyn, NY</span>
      </div>
    </footer>
  );
}
