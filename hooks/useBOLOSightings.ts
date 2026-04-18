import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import { subscribeMySightings, SightingWithId } from '../services/boloService';

interface UseBOLOSightingsResult {
  sightings: SightingWithId[];
  loading: boolean;
  error: Error | null;
}

export function useBOLOSightings(): UseBOLOSightingsResult {
  const [sightings, setSightings] = useState<SightingWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeMySightings(
      uid,
      (data) => {
        setSightings(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { sightings, loading, error };
}
