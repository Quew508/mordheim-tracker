import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import { useReferenceData } from '../../hooks/useReferenceData';
import { createId } from '../../utils/ids';
import type { Warband } from '../../types/warband';
import styles from './WarbandForm.module.scss';

interface WarbandFormProps {
  /** When provided the form runs in edit mode, pre-filling fields from this warband. */
  warband?: Warband;
}

export default function WarbandForm({ warband }: WarbandFormProps) {
  const { dispatch } = useWarband();
  const { factions } = useReferenceData();
  const navigate = useNavigate();
  const isEdit = warband !== undefined;

  const [name, setName] = useState(warband?.name ?? '');
  const [faction, setFaction] = useState(warband?.faction ?? '');
  const [notes, setNotes] = useState(warband?.notes ?? '');
  const [rating, setRating] = useState(warband?.rating ?? 0);
  const [startingGold, setStartingGold] = useState(warband?.goldCrowns ?? 0);
  const [nameError, setNameError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Warband name is required.');
      return;
    }

    if (isEdit) {
      const updated: Warband = {
        ...warband,
        name: trimmedName,
        faction: faction.trim(),
        notes: notes.trim(),
        rating,
      };
      dispatch({ type: 'UPDATE_WARBAND', payload: updated });
      navigate(`/warband/${warband.id}`);
    } else {
      const newWarband: Warband = {
        id: createId(),
        name: trimmedName,
        faction: faction.trim(),
        notes: notes.trim(),
        rating: 0,
        heroes: [],
        henchmanGroups: [],
        inventory: [],
        customEquipmentLibrary: [],
        goldCrowns: startingGold,
        wyrdstoneFragments: 0,
        transactionLog: [],
        achievements: [],
        lootLog: [],
      };
      dispatch({ type: 'ADD_WARBAND', payload: newWarband });
      navigate(`/warband/${newWarband.id}`);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.heading}>{isEdit ? 'Edit Warband' : 'New Warband'}</h1>

      <div className={styles.field}>
        <label htmlFor="warband-name" className={styles.label}>
          Name <span className={styles.required} aria-hidden="true">*</span>
        </label>
        <input
          id="warband-name"
          type="text"
          className={styles.input}
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(''); }}
          autoFocus
          aria-required="true"
          aria-describedby={nameError ? 'name-error' : undefined}
        />
        {nameError && (
          <p id="name-error" className={styles.error} role="alert">{nameError}</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="warband-faction" className={styles.label}>Faction</label>
        <select
          id="warband-faction"
          className={styles.input}
          value={faction}
          onChange={(e) => setFaction(e.target.value)}
        >
          <option value="">— No faction —</option>
          {factions.map((f) => (
            <option key={f.id} value={f.name}>{f.name}</option>
          ))}
        </select>
      </div>

      {isEdit && (
        <div className={styles.field}>
          <label htmlFor="warband-rating" className={styles.label}>Rating</label>
          <input
            id="warband-rating"
            type="number"
            className={styles.input}
            value={rating}
            min={0}
            onChange={(e) => { const v = parseInt(e.target.value, 10); setRating(isNaN(v) ? 0 : Math.max(0, v)); }}
          />
        </div>
      )}

      {!isEdit && (
        <div className={styles.field}>
          <label htmlFor="warband-gold" className={styles.label}>Starting Gold Crowns</label>
          <input
            id="warband-gold"
            type="number"
            className={styles.input}
            value={startingGold}
            min={0}
            onChange={(e) => { const v = parseInt(e.target.value, 10); setStartingGold(isNaN(v) ? 0 : Math.max(0, v)); }}
          />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="warband-notes" className={styles.label}>Notes</label>
        <textarea
          id="warband-notes"
          className={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => isEdit ? navigate(`/warband/${warband.id}`) : navigate('/')}
        >
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          {isEdit ? 'Save Changes' : 'Create Warband'}
        </button>
      </div>
    </form>
  );
}
