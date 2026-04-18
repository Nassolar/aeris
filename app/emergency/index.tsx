import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SOSButton from '../../components/dashboard/SOSButton';
import { theme } from '../../constants/theme';

export default function EmergencyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-down" size={32} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>EMERGENCY</Text>
        <Text style={styles.subtitle}>Hold the button to report your emergency</Text>
      </View>

      <View style={styles.buttonArea}>
        <SOSButton />
      </View>

      <Text style={styles.footerNote}>
        Hold for 3 seconds to dispatch. Keep holding to describe your emergency by voice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
  },
  header: {
    marginTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#CD0E11',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    marginVertical: 24,
  },
  footerNote: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 13,
    paddingBottom: 20,
  },
});
