import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SoloParentIDScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Solo Parent ID</Text>
      </View>
      <View style={styles.stub}>
        <Ionicons name="people-outline" size={56} color="#D1D5DB" />
        <Text style={styles.stubTitle}>Coming Soon</Text>
        <Text style={styles.stubBody}>
          Online Solo Parent ID applications will be available once your LGU activates this
          service.
        </Text>
      </View>
    </SafeAreaView>
  );
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
  stub: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  stubTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 10 },
  stubBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
