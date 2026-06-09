import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { publicUrl, uploadAvatar } from '../lib/storage';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [biometric, setBiometric] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      alert(error.message);
      return false;
    }
    alert('Cadastro realizado com sucesso!');
    return true;
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('E-mail ou senha incorretos!');
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const linkBiometric = (email, password) => {
    setBiometric({ email, password });
    alert('Biometria vinculada com sucesso!');
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
