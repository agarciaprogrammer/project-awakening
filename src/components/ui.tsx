import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icons';

export function XpBar({ value, max, label, segments = 20 }: { value: number; max: number; label?: string; segments?: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const filled = Math.round(pct * segments);
  return (
    <div className="xpbar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label ?? 'Experience'}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={i < filled ? 'xpbar__seg xpbar__seg--on' : 'xpbar__seg'} />
      ))}
    </div>
  );
}

export function Panel({ title, right, children, className }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className ?? ''}`}>
      {(title || right) && (
        <header className="panel__head">
          {title && <h2 className="panel__title">{title}</h2>}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function IconButton({ icon, label, onClick, className }: { icon: IconName; label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" className={`icon-btn ${className ?? ''}`} aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  );
}

/** Bottom sheet / dialog. Closes on backdrop tap and Escape. */
export function Sheet({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="sheet__title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Back',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <div className="sheet__body">{body}</div>
      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}

/** Integer input that keeps a local draft string and commits valid values on blur. */
export function NumField({
  value,
  onCommit,
  min = 0,
  max = 9999,
  label,
  className,
}: {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) {
      const clamped = Math.min(max, Math.max(min, n));
      onCommit(clamped);
      setDraft(String(clamped));
    } else setDraft(String(value));
  };
  return (
    <input
      className={`input input--num ${className ?? ''}`}
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function StatPips({ label, value, hint }: { label: string; value: number; hint: string }) {
  const pips = ((value - 1) % 10) + 1;
  return (
    <div className="stat" title={hint}>
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        <span className="stat__value">{value}</span>
      </div>
      <div className="stat__pips" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < pips ? 'pip pip--on' : 'pip'} />
        ))}
      </div>
      <span className="sr-only">{hint}</span>
    </div>
  );
}
