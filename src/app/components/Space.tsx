'use client';

import { Button } from '@fluentui/react-components';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useSpaceStore } from '@/lib/store/space/store';
import styles from './Space.module.scss';

export default function Space() {
  const isOpen = useSpaceStore((state) => state.isOpen);
  const close = useSpaceStore((state) => state.close);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [close, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className={styles.space}
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-title"
      >
        <Button
          ref={closeButtonRef}
          className={styles.closeButton}
          appearance="secondary"
          onClick={close}
        >
          Fermer
        </Button>
        <Image
          className={styles.image}
          src="/logo.svg"
          alt=""
          width={240}
          height={240}
          priority
        />
        <h1 id="space-title" className={styles.title}>
          Bientôt disponible
        </h1>
      </section>
    </div>
  );
}
