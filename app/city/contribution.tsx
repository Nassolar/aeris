import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const FALLBACK_LEDGER_URL = 'https://lgu.aeristech.ai/public/default';

export default function ContributionWebViewScreen() {
  const router = useRouter();
  const { psgcCode } = useLocalSearchParams<{ psgcCode?: string }>();
  const [ledgerUrl, setLedgerUrl] = useState<string | null>(null);

  useEffect(() => {
    async function resolveSlug() {
      const code = psgcCode ?? await resolveActivePsgcCode();
      if (!code) { setLedgerUrl(FALLBACK_LEDGER_URL); return; }

      try {
        const lguDoc = await firestore().collection('lgu_config').doc(code).get();
        const slug = lguDoc.data()?.slug as string | undefined;
        setLedgerUrl(
          slug
            ? `https://lgu.aeristech.ai/public/${slug}`
            : FALLBACK_LEDGER_URL,
        );
      } catch {
        setLedgerUrl(FALLBACK_LEDGER_URL);
      }
    }

    void resolveSlug();
  }, [psgcCode]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Public Ledger</Text>
      </View>

      {ledgerUrl ? (
        <WebView
          source={{ uri: ledgerUrl }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#2ECC71" />
            </View>
          )}
        />
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2ECC71" />
        </View>
      )}
    </SafeAreaView>
  );
}

async function resolveActivePsgcCode(): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) return null;
  try {
    const doc = await firestore().collection('citizens').doc(user.uid).get();
    return (doc.data()?.lguScopes?.primary?.psgcCode as string) ?? null;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
