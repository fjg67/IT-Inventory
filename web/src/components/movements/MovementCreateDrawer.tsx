import { useEffect, useRef, type RefObject } from 'react';
import { MovementCreateForm } from '../../pages/MovementCreateForm';

export function MovementCreateDrawer({
  siteId,
  saving,
  onCancel,
  onSaved,
  onSavingChange,
  returnFocusRef,
}: {
  siteId: string;
  saving: boolean;
  onCancel: () => void;
  onSaved: () => void;
  onSavingChange: (saving: boolean) => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(saving);
  const cancelRef = useRef(onCancel);
  savingRef.current = saving;
  cancelRef.current = onCancel;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const initialFocus = dialog.querySelector<HTMLElement>('[autofocus]:not([disabled])')
      ?? dialog.querySelector<HTMLElement>(focusableSelector);
    initialFocus?.focus();

    function trapFocus(event: KeyboardEvent) {
      const nestedDialog = dialogRef.current?.querySelector<HTMLDialogElement>('dialog[open]');
      if (nestedDialog && (event.key === 'Escape' || event.key === 'Tab')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!savingRef.current) cancelRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
      else if (returnFocusRef?.current?.isConnected) returnFocusRef.current.focus();
    };
  }, [returnFocusRef]);

  return (
    <div
      className="movement-drawer-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onCancel();
      }}
    >
      <div
        className="movement-drawer"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-create-heading"
        tabIndex={-1}
      >
        <button className="movement-drawer__close" type="button" aria-label="Fermer le formulaire de mouvement" onClick={onCancel} disabled={saving}>
          <span aria-hidden="true">×</span>
        </button>
        <MovementCreateForm
          siteId={siteId}
          onCancel={onCancel}
          onSaved={onSaved}
          onSavingChange={onSavingChange}
        />
      </div>
    </div>
  );
}
