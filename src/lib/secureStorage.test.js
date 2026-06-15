import * as SecureStore from 'expo-secure-store';
import {
  secureStorage,
  getBiometricUserId,
  setBiometricUserId,
  clearBiometricUserId,
  BIOMETRIC_USER_KEY,
} from './secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(null);
    SecureStore.deleteItemAsync.mockResolvedValue(null);
  });

  it('le um item pela chave', async () => {
    SecureStore.getItemAsync.mockResolvedValue('valor');
    await expect(secureStorage.getItem('chave')).resolves.toBe('valor');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('chave');
  });

  it('grava um item com o nivel de protecao do keychain', async () => {
    await secureStorage.setItem('chave', 'valor');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('chave', 'valor', {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  });

  it('remove um item pela chave', async () => {
    await secureStorage.removeItem('chave');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('chave');
  });

  it('le o usuario de biometria salvo', async () => {
    SecureStore.getItemAsync.mockResolvedValue('user-1');
    await expect(getBiometricUserId()).resolves.toBe('user-1');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(BIOMETRIC_USER_KEY);
  });

  it('salva o usuario de biometria', async () => {
    await setBiometricUserId('user-1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(BIOMETRIC_USER_KEY, 'user-1', {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  });

  it('limpa o usuario de biometria', async () => {
    await clearBiometricUserId();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(BIOMETRIC_USER_KEY);
  });
});
