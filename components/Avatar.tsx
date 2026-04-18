import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  backgroundColor?: string;
}

/**
 * Reusable Avatar component
 * - Shows image if URI is provided and loads successfully
 * - Falls back to initials if no image or load error
 * - Shows loading spinner while image loads
 */
export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 50,
  backgroundColor = Colors.primary || '#000',
}) => {
  const [isLoading, setIsLoading] = useState(!!uri);
  const [hasError, setHasError] = useState(false);

  // Get initials from name (e.g., "Alex Morgan" -> "AM")
  const getInitials = (fullName: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const showImage = uri && !hasError;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
  };

  const textStyle = {
    fontSize: size * 0.4,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {showImage ? (
        <>
          <Image
            source={{ uri }}
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
          {isLoading && (
            <View style={[styles.loadingOverlay, containerStyle]}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </>
      ) : (
        <Text style={[styles.initials, textStyle]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default Avatar;
