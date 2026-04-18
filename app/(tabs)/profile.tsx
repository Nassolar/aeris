import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import rnAuth from '@react-native-firebase/auth';
import {
  getUserProfile,
  saveUserProfile,
  uploadProfilePicture,
} from '../../services/userService';
import { useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';

export default function ProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [boloPoints, setBoloPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await getUserProfile();
      if (profile) {
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setAddress(profile.address || '');
        setPhotoURL(profile.photoURL || null);
        setBoloPoints(profile.boloPoints ?? 0);
      }
    } catch (e) {
      console.log('Error loading profile', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveUserProfile({ firstName, lastName, address });
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll access to change your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square crop for profile pictures
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsUploadingPhoto(true);
        const newPhotoURL = await uploadProfilePicture(result.assets[0].uri);
        setPhotoURL(newPhotoURL);
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Error changing photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    await rnAuth().signOut();
    router.replace('/(auth)/login');
  };

  const displayName = `${firstName} ${lastName}`.trim() || 'User';

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChangePhoto} disabled={isUploadingPhoto}>
            <Avatar
              uri={photoURL}
              name={displayName}
              size={100}
              backgroundColor="#333"
            />
            <View style={styles.cameraIconContainer}>
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={18} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.phoneText}>{rnAuth().currentUser?.phoneNumber}</Text>
          <Text style={styles.tapToChange}>Tap photo to change</Text>
        </View>

        {boloPoints > 0 && (
          <View style={styles.pointsCard}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <View>
              <Text style={styles.pointsLabel}>BOLO Points</Text>
              <Text style={styles.pointsValue}>{boloPoints.toLocaleString()} pts</Text>
            </View>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
          />

          <Text style={styles.label}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter home address"
            multiline
          />

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/bolo/my-sightings')}
          >
            <Ionicons name="eye-outline" size={18} color="#333" />
            <Text style={styles.linkText}>My BOLO Sightings</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  title: { fontSize: 24, fontWeight: '800' },
  logoutText: { color: Colors.error, fontWeight: '600' },
  avatarContainer: { alignItems: 'center', marginVertical: 30 },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary || '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8F8F8',
  },
  phoneText: { fontSize: 16, color: '#666', marginTop: 12 },
  tapToChange: { fontSize: 12, color: '#999', marginTop: 4 },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    fontSize: 16,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBE6',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDECC8',
  },
  pointsIcon: { fontSize: 28 },
  pointsLabel: { fontSize: 12, color: '#856404', fontWeight: '600', textTransform: 'uppercase' },
  pointsValue: { fontSize: 20, fontWeight: '800', color: '#333' },
  saveButton: {
    backgroundColor: Colors.primary || '#000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabled: { opacity: 0.7 },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    gap: 10,
  },
  linkText: { fontSize: 15, fontWeight: '600', color: '#333' },
});
