import { useNavigate } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import WarbandCard from '../WarbandCard/WarbandCard';
import StorageWarningBanner from '../StorageWarningBanner/StorageWarningBanner';
import styles from './WarbandList.module.scss';

export default function WarbandListPage() {
  const { state } = useWarband();
  const navigate = useNavigate();
  const { warbands } = state;

  return (
    <div className={styles.page}>
      <StorageWarningBanner />
      {warbands.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No warbands yet.</p>
          <button
            className={styles.newBtn}
            onClick={() => navigate('/warband/new')}
          >
            + New Warband
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {warbands.map((w) => (
            <WarbandCard key={w.id} warband={w} />
          ))}
          <button
            className={styles.newBtn}
            onClick={() => navigate('/warband/new')}
          >
            + New Warband
          </button>
        </div>
      )}
    </div>
  );
}
