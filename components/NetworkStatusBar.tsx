import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPendingCount } from '../services/offlineQueueService';

/**
 * Shows a subtle "Sending report..." bar only when there are queued uploads.
 * Never shown when idle or when device is simply offline without a queue.
 * Mount inside the root layout so it appears across all screens.
 */
export function NetworkStatusBar() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const count = await getPendingCount();
      if (mounted) setPending(count);
    };

    refresh();
    const interval = setInterval(refresh, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (pending === 0) return null;

  return (
    <View style={styles.bar}>
      <Text style={styles.text}>
        {`Sending ${pending} report${pending > 1 ? 's' : ''}...`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#5B8DEE',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
