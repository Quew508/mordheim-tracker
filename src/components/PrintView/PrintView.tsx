import { useParams, Navigate } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import { usePrint } from '../../hooks/usePrint';
import type { StatLine } from '../../types/reference';
import styles from './PrintView.module.scss';

function formatStats(stats: StatLine): string {
  return `M${stats.M} WS${stats.WS} BS${stats.BS} S${stats.S} T${stats.T} W${stats.W} I${stats.I} A${stats.A} Ld${stats.Ld}`;
}

export default function PrintViewPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useWarband();
  const warband = state.warbands.find((w) => w.id === id);

  usePrint(!warband);

  if (!warband) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`warband-print-section ${styles.page}`}>
      <h1 className={styles.title}>{warband.name}</h1>
      {warband.faction && <p className={styles.faction}>{warband.faction}</p>}
      {warband.notes && <p className={styles.notes}>{warband.notes}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Heroes</h2>
        {warband.heroes.length === 0 ? (
          <p className={styles.empty}>No heroes.</p>
        ) : (
          warband.heroes.map((hero) => (
            <div key={hero.id} className={styles.heroBlock}>
              <p className={styles.modelTitle}>
                <strong>{hero.name || '(unnamed)'}</strong>
                {hero.role ? ` — ${hero.role}` : ''}
                {` (${hero.status})`}
                {hero.recruitmentCost !== null ? ` · ${hero.recruitmentCost} gc` : ''}
              </p>
              <p className={styles.statLine}>{formatStats(hero.stats)}</p>
              <p>XP: {hero.xp}</p>
              {hero.skills.length > 0 && <p>Skills: {hero.skills.join(', ')}</p>}
              {hero.injuryLog.length > 0 && <p>Injuries: {hero.injuryLog.join(', ')}</p>}
              {hero.equipment.length > 0 && (
                <p>Equipment: {hero.equipment.map((e) =>
                  e.cost !== null ? `${e.name} (${e.cost} gc)` : e.name
                ).join(', ')}</p>
              )}
            </div>
          ))
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Henchmen</h2>
        {warband.henchmanGroups.length === 0 ? (
          <p className={styles.empty}>No henchman groups.</p>
        ) : (
          warband.henchmanGroups.map((group) => {
            const count = group.modelCountOverride !== null
              ? group.modelCountOverride
              : group.models.filter((m) => m.status === 'Active').length;
            return (
              <div key={group.id} className={styles.groupBlock}>
                <p className={styles.modelTitle}>
                  <strong>{group.name || '(unnamed)'}</strong>
                  {group.role ? ` — ${group.role}` : ''}
                  {` (${group.status}, ${count} model${count !== 1 ? 's' : ''})`}
                  {group.recruitmentCost !== null ? ` · ${group.recruitmentCost} gc` : ''}
                </p>
                <p className={styles.statLine}>{formatStats(group.stats)}</p>
                <p>XP: {group.xp}</p>
                {group.equipment.length > 0 && (
                  <p>Equipment: {group.equipment.map((e) =>
                    e.cost !== null ? `${e.name} (${e.cost} gc)` : e.name
                  ).join(', ')}</p>
                )}
              </div>
            );
          })
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Treasury</h2>
        <p>Gold: {warband.goldCrowns} gc | Wyrdstone: {warband.wyrdstoneFragments}</p>
        {warband.transactionLog.length > 0 && (
          <ul className={styles.entryList}>
            {warband.transactionLog.map((t) => (
              <li key={t.id}>
                {t.description}: {t.amount > 0 ? '+' : ''}{t.amount} gc
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Post-Game Records</h2>
        {warband.achievements.length > 0 && (
          <>
            <p><strong>Achievements:</strong></p>
            <ul className={styles.entryList}>
              {warband.achievements.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </>
        )}
        {warband.lootLog.length > 0 && (
          <>
            <p><strong>Loot:</strong></p>
            <ul className={styles.entryList}>
              {warband.lootLog.map((l) => (
                <li key={l.id}>
                  {l.description}{l.goldValue !== null ? ` (${l.goldValue} gc)` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
        {warband.achievements.length === 0 && warband.lootLog.length === 0 && (
          <p className={styles.empty}>No records.</p>
        )}
      </section>
    </div>
  );
}
