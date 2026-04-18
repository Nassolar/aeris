import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  try {
    // 1. Convert URI to Blob (Binary Large Object)
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Create a unique filename
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `${folder}/${Date.now()}_${filename}`);

    // 3. Upload
    await uploadBytes(storageRef, blob);

    // 4. Get the Public URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};