import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../lib/supabase';
import { publicUrl, uploadAvatar } from '../lib/storage';
import {
  clearBiometricUserId,
  getBiometricUserId,
  setBiometricUserId,
} from '../lib/secureStorage';

export const AuthContext = createContext({});

const LEGACY_BIOMETRIC_KEY = '@biometric_auth';

const clearLegacyAuthStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const legacySessionKeys = keys.filter(
    (key) => key.startsWith('sb-') && key.endsWith('-auth-token'),
  );
  await Promise.all([
    AsyncStorage.removeItem(LEGACY_BIOMETRIC_KEY),
    legacySessionKeys.length ? AsyncStorage.multiRemove(legacySessionKeys) : Promise.resolve(),
  ]);
};

const translateAuthError = (message) => {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('User already registered')) return 'Este e-mail já está cadastrado.';
  if (message.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (message.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail antes de entrar.';
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pendingSessionUser, setPendingSessionUser] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, is_barber, avatar_url')
      .eq('id', authUser.id)
      .single();

    setUser({
      id: authUser.id,
      email: authUser.email,
      name: data?.name ?? '',
      isBarber: data?.is_barber ?? false,
      avatarUrl: publicUrl('avatars', data?.avatar_url),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    let subscription;
    let active = true;

    const initializeAuth = async () => {
      try {
        await clearLegacyAuthStorage();

        const [savedBiometricUserId, sessionResult] = await Promise.all([
          getBiometricUserId(),
          supabase.auth.getSession(),
        ]);
        const session = sessionResult.data.session;

        if (!active) return;

        if (session?.user && savedBiometricUserId === session.user.id) {
          setPendingSessionUser(session.user);
          setBiometricEnabled(true);
          setIsBiometricLocked(true);
          setLoading(false);
        } else if (session?.user) {
          if (savedBiometricUserId) await clearBiometricUserId();
          setBiometricEnabled(false);
          await loadProfile(session.user);
        } else {
          if (savedBiometricUserId) await clearBiometricUserId();
          setBiometricEnabled(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao restaurar a sessão:', error);
        setLoading(false);
      }

      const authListener = supabase.auth.onAuthStateChange((event, session) => {
        if (!active || event === 'INITIAL_SESSION') return;

        if (!session?.user) {
          setUser(null);
          setPendingSessionUser(null);
          setIsBiometricLocked(false);
          setLoading(false);
          return;
        }

        setTimeout(() => {
          if (active) loadProfile(session.user);
        }, 0);
      });
      subscription = authListener.data.subscription;
    };

    initializeAuth();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const register = async (email, password, name, isBarber) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, is_barber: isBarber } },
    });
    if (error) {
      alert(translateAuthError(error.message));
      return false;
    }
    alert('Cadastro realizado com sucesso!');
    return true;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(translateAuthError(error.message));
      return false;
    }

    const savedBiometricUserId = await getBiometricUserId();
    if (savedBiometricUserId && savedBiometricUserId !== data.user.id) {
      await clearBiometricUserId();
      setBiometricEnabled(false);
    }
    await loadProfile(data.user);
    return true;
  };

  const logout = async () => {
    await Promise.all([
      clearBiometricUserId(),
      clearLegacyAuthStorage(),
    ]);
    await supabase.auth.signOut();
    setBiometricEnabled(false);
    setIsBiometricLocked(false);
    setPendingSessionUser(null);
    setUser(null);
  };

  const enableBiometric = async () => {
    if (!user) {
      return { success: false, message: 'Entre na sua conta antes de ativar a biometria.' };
    }

    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (!hasHardware || !isEnrolled) {
        return { success: false, message: 'Nenhuma biometria está configurada neste dispositivo.' };
      }

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ativar acesso por biometria',
        cancelLabel: 'Cancelar',
      });
      if (!auth.success) {
        return { success: false, message: 'Não foi possível confirmar sua biometria.' };
      }

      await setBiometricUserId(user.id);
      setBiometricEnabled(true);
      return { success: true };
    } catch (error) {
      console.error('Erro ao ativar biometria:', error);
      return { success: false, message: 'Não foi possível ativar a biometria neste dispositivo.' };
    }
  };

  const unlockBiometric = async () => {
    if (!pendingSessionUser) return false;

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Barber Click',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (!auth.success) return false;

    setLoading(true);
    await loadProfile(pendingSessionUser);
    setPendingSessionUser(null);
    setIsBiometricLocked(false);
    return true;
  };

  const updateAvatar = async (uri) => {
    if (!user) return;
    const { path } = await uploadAvatar(user.id, uri);
    await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id);
    setUser((prev) => ({ ...prev, avatarUrl: publicUrl('avatars', path) }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        enableBiometric,
        unlockBiometric,
        biometricEnabled,
        isBiometricLocked,
        loading,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
