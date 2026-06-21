import { useParams, Navigate } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import WarbandForm from '../WarbandForm/WarbandForm';

export default function WarbandEditPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useWarband();
  const warband = state.warbands.find((w) => w.id === id);

  if (!warband) {
    return <Navigate to="/" replace />;
  }

  return <WarbandForm warband={warband} />;
}
