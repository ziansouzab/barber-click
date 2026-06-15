import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { createQueryBuilder } from '../test/supabaseMock';
import * as LocalAuthentication from 'expo-local-authentication';
import { getBiometricUserId, setBiometricUserId, clearBiometricUserId } from '../lib/secureStorage';
import { uploadAvatar, removeStoredImage } from '../lib/storage';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(),
  },
}));

jest.mock('../lib/storage', () => ({
  publicUrl: jest.fn((bucket, path) => (path ? `https://cdn/${bucket}/${path}` : null)),
  removeStoredImage: jest.fn(() => Promise.resolve()),
  uploadAvatar: jest.fn(),
}));

jest.mock('../lib/secureStorage', () => ({
  getBiometricUserId: jest.fn(() => Promise.resolve(null)),
  setBiometricUserId: jest.fn(() => Promise.resolve()),
  clearBiometricUserId: jest.fn(() => Promise.resolve()),
}));

const perfil = { name: 'Gabriel', is_barber: false, avatar_url: null };

async function renderAuthHook() {
  const view = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

async function loginAndRender() {
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user: { id: 'u1', email: 'a@b.com' } },
    error: null,
  });
  const view = await renderAuthHook();
  await act(async () => {
    await view.result.current.login('a@b.com', 'senha');
  });
  return view;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    supabase.from.mockReturnValue(createQueryBuilder({ data: perfil, error: null }));
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    getBiometricUserId.mockResolvedValue(null);
    uploadAvatar.mockResolvedValue({ path: 'avatars/u1/novo.jpg' });
    removeStoredImage.mockResolvedValue();
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('login', () => {
    it('autentica e carrega o perfil no sucesso', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
        error: null,
      });
      const { result } = await renderAuthHook();
      let user;
      await act(async () => {
        user = await result.current.login('a@b.com', 'senha');
      });
      expect(user).toEqual({ id: 'u1', email: 'a@b.com' });
      expect(result.current.user).toMatchObject({ id: 'u1', name: 'Gabriel', isBarber: false });
    });

    it('limpa a biometria de outro usuario ao entrar', async () => {
      getBiometricUserId.mockResolvedValueOnce(null).mockResolvedValueOnce('outro-usuario');
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
        error: null,
      });
      const { result } = await renderAuthHook();
      await act(async () => {
        await result.current.login('a@b.com', 'senha');
      });
      expect(clearBiometricUserId).toHaveBeenCalled();
    });
  });

  describe('translateAuthError via login', () => {
    const casos = [
      ['Invalid login credentials', 'E-mail ou senha incorretos.'],
      ['User already registered', 'Este e-mail já está cadastrado.'],
      ['Password should be at least 6 characters', 'A senha deve ter no mínimo 6 caracteres.'],
      ['rate limit reached', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
      ['Email not confirmed', 'Por favor, confirme seu e-mail antes de entrar.'],
      ['unexpected failure', 'Ocorreu um erro inesperado. Tente novamente.'],
    ];

    it.each(casos)('traduz "%s"', async (apiMessage, traduzido) => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: apiMessage },
      });
      const { result } = await renderAuthHook();
      let user;
      await act(async () => {
        user = await result.current.login('a@b.com', 'x');
      });
      expect(user).toBeNull();
      expect(global.alert).toHaveBeenCalledWith(traduzido);
    });
  });

  describe('register', () => {
    it('cadastra e retorna true no sucesso', async () => {
      supabase.auth.signUp.mockResolvedValue({ error: null });
      const { result } = await renderAuthHook();
      let ok;
      await act(async () => {
        ok = await result.current.register('a@b.com', 'senha', 'Gabriel', false);
      });
      expect(ok).toBe(true);
      expect(global.alert).toHaveBeenCalledWith('Cadastro realizado com sucesso!');
    });

    it('retorna false e alerta a traducao no erro', async () => {
      supabase.auth.signUp.mockResolvedValue({ error: { message: 'User already registered' } });
      const { result } = await renderAuthHook();
      let ok;
      await act(async () => {
        ok = await result.current.register('a@b.com', 'senha', 'Gabriel', false);
      });
      expect(ok).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Este e-mail já está cadastrado.');
    });
  });

  describe('logout', () => {
    it('encerra a sessao e limpa o usuario', async () => {
      const { result } = await loginAndRender();
      await act(async () => {
        await result.current.logout();
      });
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(clearBiometricUserId).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  describe('enableBiometric', () => {
    it('falha quando nao ha usuario nem id informado', async () => {
      const { result } = await renderAuthHook();
      let res;
      await act(async () => {
        res = await result.current.enableBiometric();
      });
      expect(res).toEqual({
        success: false,
        message: 'Entre na sua conta antes de ativar a biometria.',
      });
    });

    it('falha quando o dispositivo nao tem biometria configurada', async () => {
      LocalAuthentication.hasHardwareAsync.mockResolvedValue(false);
      const { result } = await renderAuthHook();
      let res;
      await act(async () => {
        res = await result.current.enableBiometric('u1');
      });
      expect(res).toEqual({
        success: false,
        message: 'Nenhuma biometria está configurada neste dispositivo.',
      });
    });

    it('falha quando a autenticacao biometrica nao e confirmada', async () => {
      LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false });
      const { result } = await renderAuthHook();
      let res;
      await act(async () => {
        res = await result.current.enableBiometric('u1');
      });
      expect(res).toEqual({
        success: false,
        message: 'Não foi possível confirmar sua biometria.',
      });
    });

    it('ativa a biometria no sucesso', async () => {
      const { result } = await renderAuthHook();
      let res;
      await act(async () => {
        res = await result.current.enableBiometric('u1');
      });
      expect(res).toEqual({ success: true });
      expect(setBiometricUserId).toHaveBeenCalledWith('u1');
      expect(result.current.biometricEnabled).toBe(true);
    });

    it('trata excecao do modulo de biometria', async () => {
      LocalAuthentication.hasHardwareAsync.mockRejectedValue(new Error('hw erro'));
      const { result } = await renderAuthHook();
      let res;
      await act(async () => {
        res = await result.current.enableBiometric('u1');
      });
      expect(res).toEqual({
        success: false,
        message: 'Não foi possível ativar a biometria neste dispositivo.',
      });
    });
  });

  describe('updateAvatar', () => {
    it('falha quando nao ha usuario autenticado', async () => {
      const { result } = await renderAuthHook();
      let res;
      await act(async () => {
        res = await result.current.updateAvatar('file://novo.jpg');
      });
      expect(res).toEqual({ success: false, message: 'Usuário não autenticado.' });
    });

    it('falha quando o upload do avatar nao retorna caminho', async () => {
      uploadAvatar.mockRejectedValue(new Error('upload erro'));
      const { result } = await loginAndRender();
      let res;
      await act(async () => {
        res = await result.current.updateAvatar('file://novo.jpg');
      });
      expect(res).toEqual({
        success: false,
        message: 'Não foi possível enviar a foto. Tente novamente.',
      });
    });

    it('reverte e avisa quando nao consegue salvar no perfil', async () => {
      const { result } = await loginAndRender();
      supabase.from.mockReturnValue(createQueryBuilder({ error: { message: 'update erro' } }));
      let res;
      await act(async () => {
        res = await result.current.updateAvatar('file://novo.jpg');
      });
      expect(res).toEqual({
        success: false,
        message: 'A foto foi enviada, mas não foi possível salvar no seu perfil.',
      });
      expect(removeStoredImage).toHaveBeenCalledWith('avatars', 'avatars/u1/novo.jpg');
    });

    it('atualiza o avatar no sucesso', async () => {
      const { result } = await loginAndRender();
      let res;
      await act(async () => {
        res = await result.current.updateAvatar('file://novo.jpg');
      });
      expect(res).toEqual({ success: true });
    });

    it('remove o avatar anterior apos salvar o novo', async () => {
      supabase.from.mockReturnValue(
        createQueryBuilder({
          data: { name: 'Gabriel', is_barber: false, avatar_url: 'u1/antigo.jpg' },
          error: null,
        })
      );
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
        error: null,
      });
      const { result } = await renderAuthHook();
      await act(async () => {
        await result.current.login('a@b.com', 'senha');
      });
      await act(async () => {
        await result.current.updateAvatar('file://novo.jpg');
      });
      expect(removeStoredImage).toHaveBeenCalledWith('avatars', 'u1/antigo.jpg');
    });
  });

  describe('unlockBiometric', () => {
    it('retorna falso quando nao ha sessao pendente', async () => {
      const { result } = await renderAuthHook();
      let ok;
      await act(async () => {
        ok = await result.current.unlockBiometric();
      });
      expect(ok).toBe(false);
    });
  });

  describe('inicializacao com biometria', () => {
    beforeEach(() => {
      getBiometricUserId.mockResolvedValue('u1');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u1', email: 'a@b.com' } } },
      });
    });

    it('inicia bloqueado quando ha sessao e biometria salva', async () => {
      const { result } = await renderAuthHook();
      expect(result.current.isBiometricLocked).toBe(true);
      expect(result.current.biometricEnabled).toBe(true);
    });

    it('desbloqueia ao confirmar a biometria', async () => {
      const { result } = await renderAuthHook();
      let ok;
      await act(async () => {
        ok = await result.current.unlockBiometric();
      });
      expect(ok).toBe(true);
      expect(result.current.isBiometricLocked).toBe(false);
      expect(result.current.user).toMatchObject({ id: 'u1' });
    });

    it('mantem bloqueado quando a biometria falha', async () => {
      LocalAuthentication.authenticateAsync.mockResolvedValue({ success: false });
      const { result } = await renderAuthHook();
      let ok;
      await act(async () => {
        ok = await result.current.unlockBiometric();
      });
      expect(ok).toBe(false);
      expect(result.current.isBiometricLocked).toBe(true);
    });
  });

  describe('inicializacao com sessao ativa', () => {
    it('carrega o perfil quando ha sessao sem biometria salva', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u1', email: 'a@b.com' } } },
      });
      const { result } = await renderAuthHook();
      expect(result.current.user).toMatchObject({ id: 'u1' });
    });

    it('encerra o loading quando a restauracao da sessao falha', async () => {
      supabase.auth.getSession.mockRejectedValue(new Error('sessao erro'));
      const { result } = await renderAuthHook();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('mudancas de sessao', () => {
    let authCallback;

    beforeEach(() => {
      authCallback = null;
      supabase.auth.onAuthStateChange.mockImplementation((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });
    });

    it('ignora o evento inicial de sessao', async () => {
      const { result } = await renderAuthHook();
      await act(async () => {
        authCallback('INITIAL_SESSION', { user: { id: 'u1' } });
      });
      expect(result.current.user).toBeNull();
    });

    it('limpa o usuario quando a sessao termina', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
        error: null,
      });
      const { result } = await renderAuthHook();
      await act(async () => {
        await result.current.login('a@b.com', 'senha');
      });
      await act(async () => {
        authCallback('SIGNED_OUT', null);
      });
      expect(result.current.user).toBeNull();
    });

    it('recarrega o perfil quando a sessao e renovada', async () => {
      const { result } = await renderAuthHook();
      await act(async () => {
        authCallback('TOKEN_REFRESHED', { user: { id: 'u1', email: 'a@b.com' } });
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(result.current.user).toMatchObject({ id: 'u1' });
    });
  });
});
