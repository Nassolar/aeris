import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Clay / 3D Style Theme
const theme = {
  cardBg: '#1E293B',
  clayShadowLight: 'rgba(255, 255, 255, 0.1)',
  clayShadowDark: 'rgba(0, 0, 0, 0.3)',
  text: '#cbd5e1',
};

interface Service {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgGradient: string;
  iconColor: string;
}

const services: Service[] = [
  {
    id: 'police',
    name: 'POLICE',
    icon: 'shield',
    color: '#60A5FA',
    bgGradient: '#3B82F6',
    iconColor: '#FFF'
  },
  {
    id: 'medical',
    name: 'MEDICAL',
    icon: 'medkit',
    color: '#F87171',
    bgGradient: '#EF4444',
    iconColor: '#FFF'
  },
  {
    id: 'rescue',
    name: 'RESCUE',
    icon: 'flame', // Fallback for 3D Life Buoy (not in standard set)
    color: '#FBBF24',
    bgGradient: '#F59E0B',
    iconColor: '#FFF'
  },
];

export default function ServiceGrid() {
  const router = useRouter();

  const handlePress = (serviceId: string) => {
    router.push({ pathname: '/report', params: { category: serviceId } });
  };

  return (
    <View style={styles.grid}>
      {services.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => handlePress(service.id)}
        >
          {/* Inner "Clay" Container */}
          <View style={[styles.iconContainer, { backgroundColor: service.bgGradient }]}>
            {/* Top Highlight for 3D effect */}
            <View style={styles.highlight} />
            <Ionicons name={service.icon} size={26} color={service.iconColor} />
          </View>
          <Text style={styles.label}>{service.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: theme.cardBg, // Base background
    paddingVertical: 16, // Reduced from 24
    borderRadius: 20, // Slightly reduced
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 56, // Reduced from 64
    height: 56,
    borderRadius: 28, // Circle
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12, // Reduced from 16
    // Clay Effect: Inner Shadow & Drop Shadow combo
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  highlight: {
    position: 'absolute',
    top: 4,
    left: 10,
    width: 16, // Reduced proportion
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ rotate: '-45deg' }],
  },
  label: {
    fontSize: 10, // Reduced from 12
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
});