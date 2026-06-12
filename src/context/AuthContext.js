import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { publicUrl, uploadAvatar } from '../lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({});

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
  const [biometric, setBiometric] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBiometrics = async () => {
      try {
        const savedBiometric = await AsyncStorage.getItem('@biometric_auth');
        if (savedBiometric) {
          setBiometric(JSON.parse(savedBiometric));
        }
      } catch (error) {
        console.error("Erro ao carregar biometria:", error);
      }
    };
    loadBiometrics();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (authUser) => {
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
  };

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(translateAuthError(error.message));
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const linkBiometric = async (email, password) => {
    const credentials = { email, password };
    
    try {
      await AsyncStorage.setItem('@biometric_auth', JSON.stringify(credentials));
      setBiometric(credentials);
      alert('Biometrica vinculada com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar biometria", error);
      alert("Não foi possível cadastrar a biometria neste dispositivo!");
    }
  };

  const updateAvatar = async (uri) => {
    if (!user) return;
    const { path } = await uploadAvatar(user.id, uri);
    await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id);
    setUser((prev) => ({ ...prev, avatarUrl: publicUrl('avatars', path) }));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, linkBiometric, biometric, loading, updateAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
