import { useNavigate } from 'react-router';
import type { Warband } from '../../types/warband';
import { computeWarbandRating } from '../../utils/warband';
import styles from './WarbandCard.module.scss';

interface WarbandCardProps {
  warband: Warband;
}

export default function WarbandCard({ warband }: WarbandCardProps) {
  const navigate = useNavigate();

  return (
    <button
      className={styles.card}
      onClick={() => navigate(`/warband/${warband.id}`)}
      aria-label={`Open ${warband.name}`}
    >
      <div className={styles.name}>{warband.name}</div>
      {warband.faction && (
        <div className={styles.faction}>{warband.faction}</div>
      )}
      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Rating</span>
          <span className={styles.statValue}>{computeWarbandRating(warband)}</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statLabel} ${styles.statGold}`}>Gold</span>
          <span className={`${styles.statValue} ${styles.statGoldValue}`}>{warband.goldCrowns}</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statLabel} ${styles.statWyrdstone}`}>Wyrdstone</span>
          <span className={`${styles.statValue} ${styles.statWyrdstoneValue}`}>{warband.wyrdstoneFragments}</span>
        </div>
      </div>
    </button>
  );
}
