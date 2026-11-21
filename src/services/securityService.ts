import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { CompleteAppState } from '../db/database';

const PIN_KEY = 'GET_UP_LUKA_SECURE_PIN_V1';

export async function savePinCode(pin: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(PIN_KEY, pin);
    return;
  }
  try {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  } catch {
    await AsyncStorage.setItem(PIN_KEY, pin);
  }
}

export async function verifyPinCode(inputPin: string): Promise<boolean> {
  let stored: string | null = null;
  if (Platform.OS === 'web') {
    stored = await AsyncStorage.getItem(PIN_KEY);
  } else {
    try {
      stored = await SecureStore.getItemAsync(PIN_KEY);
    } catch {
      stored = await AsyncStorage.getItem(PIN_KEY);
    }
  }
  if (!stored) return true;
  return stored === inputPin;
}

export async function hasStoredPin(): Promise<boolean> {
  if (Platform.OS === 'web') {
    const val = await AsyncStorage.getItem(PIN_KEY);
    return Boolean(val);
  }
  try {
    const val = await SecureStore.getItemAsync(PIN_KEY);
    return Boolean(val);
  } catch {
    const val = await AsyncStorage.getItem(PIN_KEY);
    return Boolean(val);
  }
}

export async function clearPinCode(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(PIN_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
  } catch {}
  await AsyncStorage.removeItem(PIN_KEY);
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Odkleni GET UP / Unlock GET UP',
      fallbackLabel: 'Uporabi PIN',
      cancelLabel: 'Prekliči',
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Copies a picked image URI into the app's private persistent document directory
 * so user photos are never lost when OS cache clears.
 */
export async function persistPrivatePhoto(sourceUri: string, prefix: string = 'photo'): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return sourceUri;
  }
  try {
    const vaultDir = `${FileSystem.documentDirectory}private_vault/`;
    const dirInfo = await FileSystem.getInfoAsync(vaultDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(vaultDir, { intermediates: true });
    }
    const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
    const destUri = `${vaultDir}${prefix}_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch {
    return sourceUri;
  }
}

/**
 * Exports the entire GET UP database state (including embedded photo base64 when possible) to a JSON backup file.
 */
export async function exportCompleteBackup(state: CompleteAppState): Promise<{
  success: boolean;
  message: string;
}> {
  const backupPayload = {
    app: 'GET UP — Luka Bodlaj Personal OS',
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const jsonString = JSON.stringify(backupPayload, null, 2);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `get-up-luka-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, message: 'Backup downloaded.' };
  }

  try {
    const fileUri = `${FileSystem.documentDirectory}get-up-luka-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Shrani varnostno kopijo GET UP / Export GET UP Backup',
      });
    }
    return { success: true, message: fileUri };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Export failed' };
  }
}

export async function importBackupFromFile(): Promise<CompleteAppState | null> {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets || res.assets.length === 0) {
      return null;
    }
    const asset = res.assets[0];
    let content = '';
    if (Platform.OS === 'web' && (asset as any).file) {
      content = await (asset as any).file.text();
    } else {
      content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
    const parsed = JSON.parse(content);
    const stateData = (parsed.data || parsed) as CompleteAppState;
    if (stateData && stateData.settings && Array.isArray(stateData.habits)) {
      return stateData;
    }
    return null;
  } catch {
    return null;
  }
}
