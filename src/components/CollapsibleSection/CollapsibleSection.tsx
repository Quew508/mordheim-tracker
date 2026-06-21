import type { ReactNode } from 'react';
import styles from './CollapsibleSection.module.scss';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const contentId = `section-content-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={styles.section}>
      <button
        className={styles.header}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className={styles.title}>{title}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
          ›
        </span>
      </button>
      {isOpen && (
        <div id={contentId} className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}
