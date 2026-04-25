import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { INTENT_HINT_MAP, IntentHint } from '../constants/intentHintMap';

function detectSocialMediaDownload(uri: string): boolean {
  const socialPatterns = [
    'facebook', 'fb.com', 'fbcdn',
    'tiktok', 'tiktokcdn',
    'instagram', 'cdninstagram',
    'youtube', 'youtu.be',
    'twitter', 'twimg',
  ];
  return socialPatterns.some(p => uri.toLowerCase().includes(p));
}

const getDeviceIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    return 'unknown';
  }
};

// 1. Define the Strict Interface
export interface CapturedImageData {
  uri: string;
  capturedInApp: boolean;
  exifTimestampMs: number | null;
  citizenContextNote: string | null;
}

export interface CapturedVideoData {
  uri: string;
  capturedInApp: boolean;
  durationMs: number | null;
  citizenContextNote: string | null;
}

export interface ReportData {
  reportId: string;
  category: string;
  description: string;
  additionalInfo?: string;
  images: CapturedImageData[];
  videos?: CapturedVideoData[];
  location: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  isAnonymous?: boolean;
  intentHint?: IntentHint | null;
  submissionMode?: 'button_assisted' | 'text_only';
}

export const ReportService = {
  // --- A. PERMISSIONS ---
  requestPermissions: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  // --- B. GET CURRENT LOCATION (For the Map UI) ---
  getCurrentLocation: async () => {
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (error) {
      console.warn("Error getting location:", error);
      return null;
    }
  },

  // --- C. SUBMIT REPORT (The Dual-Location Logic) ---
  submitReport: async (data: ReportData) => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      const imageUrls: string[] = [];
      const videoUrls: string[] = [];

      // 1a. Upload Images and write evidence subcollection docs
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        try {
          const filename = `reports/${data.reportId}_img_${Date.now()}_${i}.jpg`;
          const storageRef = storage().ref(filename);
          await storageRef.putFile(img.uri);
          const url = await storageRef.getDownloadURL();
          imageUrls.push(url);

          // Write evidence doc — triggers onEvidenceUploaded Cloud Function
          const evidenceId = `${data.reportId}_img_${i}`;
          const isCapturedInApp = img.capturedInApp;
          const isSocialMedia = detectSocialMediaDownload(img.uri);
          await firestore()
            .collection('reports')
            .doc(data.reportId)
            .collection('evidence')
            .doc(evidenceId)
            .set({
              url,
              mimeType: 'image/jpeg',
              capturedInApp: isCapturedInApp,
              hash: null,
              exifTimestampMs: img.exifTimestampMs,
              citizenContextNote: img.citizenContextNote,
              uploadedAt: firestore.FieldValue.serverTimestamp(),
              trust: {
                score: null,
                level: null,
                capturedInApp: isCapturedInApp,
                flags: [],
                geminiAnalysis: null,
                isSocialMedia,
                isScreenshot: false,
                isScreenRecording: false,
                citizenContextNote: null,
              },
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
        } catch (uploadError) {
          console.error(`Image ${i} upload failed:`, uploadError);
        }
      }

      // 1b. Upload Videos and write evidence subcollection docs
      const videos = data.videos ?? [];
      for (let i = 0; i < videos.length; i++) {
        const vid = videos[i];
        try {
          const filename = `reports/${data.reportId}_vid_${Date.now()}_${i}.mp4`;
          const storageRef = storage().ref(filename);
          await storageRef.putFile(vid.uri);
          const url = await storageRef.getDownloadURL();
          videoUrls.push(url);

          const evidenceId = `${data.reportId}_vid_${i}`;
          const vidCapturedInApp = vid.capturedInApp;
          const vidIsSocialMedia = detectSocialMediaDownload(vid.uri);
          await firestore()
            .collection('reports')
            .doc(data.reportId)
            .collection('evidence')
            .doc(evidenceId)
            .set({
              url,
              mimeType: 'video/mp4',
              capturedInApp: vidCapturedInApp,
              hash: null,
              durationMs: vid.durationMs,
              citizenContextNote: vid.citizenContextNote,
              uploadedAt: firestore.FieldValue.serverTimestamp(),
              trust: {
                score: null,
                level: null,
                capturedInApp: vidCapturedInApp,
                flags: [],
                geminiAnalysis: null,
                isSocialMedia: vidIsSocialMedia,
                isScreenshot: false,
                isScreenRecording: false,
                citizenContextNote: null,
              },
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
        } catch (uploadError) {
          console.error(`Video ${i} upload failed:`, uploadError);
        }
      }

      // 2. SILENT FETCH: "Reporter Location" (Live GPS at moment of send)
      let liveCoords = { latitude: 0, longitude: 0 };
      try {
        const liveLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        liveCoords = {
          latitude: liveLocation.coords.latitude,
          longitude: liveLocation.coords.longitude
        };
      } catch (e) {
        console.warn("Could not fetch live GPS, falling back to map pin");
        liveCoords = { latitude: data.location.latitude, longitude: data.location.longitude };
      }

      // 3. REVERSE GEOCODE: "Incident Location" (Address from Pin)
      let addressString = "Unknown Location";
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: data.location.latitude,
          longitude: data.location.longitude
        });
        if (geocode.length > 0) {
          const g = geocode[0];
          addressString = [g.street, g.district, g.city, g.region]
            .filter(part => part)
            .join(', ');
        }
      } catch (e) {
        console.log("Geocoding failed, using coords only");
      }

      // 4. CONSTRUCT PAYLOAD
      const intentHint = data.intentHint ?? null;
      const mapped = intentHint && intentHint in INTENT_HINT_MAP ? INTENT_HINT_MAP[intentHint] : null;
      const resolvedCategory = mapped?.category ?? data.category;
      const resolvedTrack = mapped?.track ?? null;
      const submissionMode = data.submissionMode ?? (mapped ? 'button_assisted' : 'text_only');

      const displayName = data.isAnonymous ? "Anonymous" : (user.displayName || "Anonymous Citizen");
      const reportPayload = {
        reportId: data.reportId,
        reportedBy: data.isAnonymous ? null : user.uid,
        userId: data.isAnonymous ? null : user.uid,
        userName: displayName,
        reporterName: displayName,
        category: resolvedCategory,
        description: data.description,
        rawInput: data.description,
        additionalInfo: data.additionalInfo || "",
        intentHint: intentHint,
        submissionMode,
        ...(resolvedTrack ? { track: resolvedTrack } : {}),
        classificationComplete: false,
        routingStatus: 'pending',
        imageUrls: imageUrls,
        videoUrls: videoUrls,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        timestamp: firestore.FieldValue.serverTimestamp(),
        isAnonymous: data.isAnonymous || false,

        reporterIdentity: data.isAnonymous ? {
          actualName: user.displayName || 'Unknown',
          email: user.email || null,
          phone: user.phoneNumber || null,
          ipAddress: await getDeviceIP(),
          deviceInfo: `${Platform.OS} ${Platform.Version}`,
          submittedAt: firestore.FieldValue.serverTimestamp()
        } : null,

        // Required by onReportCreated Cloud Function for GPS routing
        immutableEvidence: {
          gps: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          },
          captureLocation: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            address: addressString || "pinned location",
          },
          citizenReport: {
            reporterName: displayName,
            category: data.category,
            description: data.description,
            additionalInfo: data.additionalInfo || "",
            imageUrl: imageUrls[0] ?? null,
          },
          timestamps: {
            dispatchTime: null,
            arrivalTime: null,
            onSiteTime: null,
            departureTime: null,
          },
          deviceInfo: {
            model: `${Platform.OS} ${Platform.Version}`,
            appVersion: '1.0',
          },
        },

        incidentLocation: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: addressString || "pinned location",
          source: "map_pin"
        },

        reporterLocation: {
          latitude: liveCoords.latitude,
          longitude: liveCoords.longitude,
          timestamp: firestore.FieldValue.serverTimestamp()
        },

        location: {
          ...data.location,
          address: addressString || "pinned location",
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // 5. SAVE TO FIRESTORE (Native SDK)
      await firestore().collection("reports").doc(data.reportId).set(reportPayload);

      return true;
    } catch (error) {
      console.error("Error submitting report:", error);
      throw error;
    }
  }
};
