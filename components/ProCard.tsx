import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ServiceProvider } from '../types';

interface ProCardProps {
  provider: ServiceProvider;
  onBookPress?: (provider: ServiceProvider) => void;
  onCardPress?: (provider: ServiceProvider) => void;
  isLoading?: boolean; // <--- ✅ Added this back correctly
}

export const ProCard: React.FC<ProCardProps> = ({
  provider,
  onBookPress,
  onCardPress,
  isLoading = false, // <--- ✅ Default to false
}) => {
  const handleBookPress = () => {
    if (isLoading) return; // Prevent clicks while loading

    if (onBookPress) {
      onBookPress(provider);
    } else {
      Alert.alert(
        'Book Service',
        `Book ${provider.name} for ${provider.role} service?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Book Now', onPress: () => console.log('Booking...') },
        ]
      );
    }
  };

  const handleCardPress = () => {
    if (onCardPress) {
      onCardPress(provider);
    } else {
      Alert.alert(provider.name, `${provider.role}\nRating: ${provider.rating}⭐\nDistance: ${provider.distance}km away`);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: provider.imageUrl }} style={styles.avatar} />
        <View style={styles.cardInfo}>
          <Text style={styles.proName}>{provider.name}</Text>
          <Text style={styles.proRole}>
            {provider.role} • {provider.distance}km away
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{provider.rating}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₱{provider.price}</Text>
          <Text style={styles.priceUnit}>/hr</Text>
          {provider.isOnline && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.bookButton, isLoading && styles.bookButtonDisabled]} // <--- ✅ Style change
          onPress={handleBookPress}
          activeOpacity={0.8}
          disabled={isLoading} // <--- ✅ Disable interaction
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} /> // <--- ✅ Spinner
          ) : (
            <Text style={styles.bookButtonText}>Book Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border || '#eee', // Fallback if undefined
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface || '#f0f0f0',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  proName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  proRole: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  onlineBadge: {
    marginLeft: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.online || '#34C759',
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100, // Ensure width doesn't shrink when text changes to spinner
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.7, // Visual feedback for disabled state
  },
  bookButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});