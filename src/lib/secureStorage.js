import * as SecureStore from 'expo-secure-store';

export const BIOMETRIC_USER_KEY = 'barber-click.biometric-user-id';

export const secureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) =>
    SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    }),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const getBiometricUserId = () => SecureStore.getItemAsync(BIOMETRIC_USER_KEY);

export const setBiometricUserId = (userId) =>
  SecureStore.setItemAsync(BIOMETRIC_USER_KEY, userId, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });

export const clearBiometricUserId = () => SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY);
