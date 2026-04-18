import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  address?: string;
  photoURL?: string | null;
  pushToken?: string;
  role?: 'customer' | 'responder' | 'admin';
  boloPoints?: number;
  createdAt?: any;
  updatedAt?: any;
  isOnline?: boolean;
}

// Save or Update User Profile
export const saveUserProfile = async (data: Partial<UserProfile>, explicitUid?: string) => {
  try {
    const firebaseUser = auth().currentUser;
    const targetUid = explicitUid || firebaseUser?.uid;

    console.log('[UserService] Saving profile for UID:', targetUid);
    console.log('[UserService] Firebase User:', firebaseUser ? 'Found' : 'Null');

    if (!targetUid) {
      throw new Error("Cannot save profile: No UID provided and no user logged in.");
    }

    const userRef = firestore().collection('users').doc(targetUid);

    // Prepare data to ensure no undefined values are passed to Firestore
    const finalData = {
      uid: targetUid,
      phoneNumber: firebaseUser?.phoneNumber || null,
      ...data
    };

    console.log('[UserService] Writing data:', JSON.stringify(finalData));

    // Merge: true ensures we don't overwrite existing fields if we only send one
    await userRef.set(finalData, { merge: true });
    console.log('[UserService] Save success');

  } catch (error) {
    console.error('[UserService] Save error:', error);
    throw error;
  }
};

// Get User Profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) return null;

    const docSnap = await firestore().collection('users').doc(firebaseUser.uid).get();

    if (docSnap.exists) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error('[UserService] Get profile error:', error);
    return null;
  }
};

// Get User Profile by ID
export const getUserProfileById = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await firestore().collection('users').doc(uid).get();

    if (docSnap.exists) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('[UserService] Get profile by ID error:', error);
    return null;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (imageUri: string, explicitUid?: string): Promise<string> => {
  try {
    const firebaseUser = auth().currentUser;
    const targetUid = explicitUid || firebaseUser?.uid;

    if (!targetUid) throw new Error("No user logged in (UID missing - upload)");

    console.log('📤 Uploading profile picture...');

    const reference = storage().ref(`profile_photos/${targetUid}.jpg`);

    await reference.putFile(imageUri);

    const downloadURL = await reference.getDownloadURL();
    console.log('✅ Profile picture uploaded:', downloadURL);

    await saveUserProfile({ photoURL: downloadURL }, targetUid);

    return downloadURL;
  } catch (error) {
    console.error('[UserService] Upload error:', error);
    throw error;
  }
};