import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const setup = () => renderHook(() => useAuth(), { wrapper });

const registrar = (result, email, senha, nome, isBarber) => {
  let retorno;
  act(() => {
    retorno = result.current.register(email, senha, nome, isBarber);
  });
  return retorno;
};

const logar = (result, email, senha) => {
  let retorno;
  act(() => {
    retorno = result.current.login(email, senha);
  });
  return retorno;
};

beforeEach(() => {
  global.alert = jest.fn();
});

describe('AuthContext', () => {
  test('register retorna true e cadastra um email novo', () => {
    const { result } = setup();

    expect(registrar(result, 'ana@x.com', '123', 'Ana', false)).toBe(true);
  });

  test('register retorna false quando o email ja existe', () => {
    const { result } = setup();
    registrar(result, 'ana@x.com', '123', 'Ana', false);

    expect(registrar(result, 'ana@x.com', '456', 'Outra', false)).toBe(false);
  });

  test('register gera ids incrementais entre usuarios', () => {
    const { result } = setup();
    registrar(result, 'ana@x.com', '123', 'Ana', false);
    registrar(result, 'bob@x.com', '456', 'Bob', true);

    logar(result, 'ana@x.com', '123');
    expect(result.current.user.id).toBe(1);

    logar(result, 'bob@x.com', '456');
    expect(result.current.user.id).toBe(2);
  });

  test('login retorna true e define o usuario com credenciais corretas', () => {
    const { result } = setup();
    registrar(result, 'ana@x.com', '123', 'Ana', true);

    expect(logar(result, 'ana@x.com', '123')).toBe(true);
    expect(result.current.user).toMatchObject({
      name: 'Ana',
      email: 'ana@x.com',
      isBarber: true,
    });
  });

  test('login retorna false quando a senha esta errada', () => {
    const { result } = setup();
    registrar(result, 'ana@x.com', '123', 'Ana', false);

    expect(logar(result, 'ana@x.com', 'errada')).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('login retorna false quando o email nao existe', () => {
    const { result } = setup();

    expect(logar(result, 'ninguem@x.com', '123')).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('logout limpa o usuario autenticado', () => {
    const { result } = setup();
    registrar(result, 'ana@x.com', '123', 'Ana', false);
    logar(result, 'ana@x.com', '123');
    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  test('logout nao afeta o usersDb e permite novo login', () => {
    const { result } = setup();
    registrar(result, 'ana@x.com', '123', 'Ana', false);
    logar(result, 'ana@x.com', '123');

    act(() => {
      result.current.logout();
    });

    expect(logar(result, 'ana@x.com', '123')).toBe(true);
    expect(result.current.user).toMatchObject({ email: 'ana@x.com' });
  });

  test('linkBiometric armazena email e senha para a biometria', () => {
    const { result } = setup();

    act(() => {
      result.current.linkBiometric('ana@x.com', '123');
    });

    expect(result.current.biometric).toEqual({
      email: 'ana@x.com',
      password: '123',
    });
  });

  test('linkBiometric sobrescreve os dados na segunda chamada', () => {
    const { result } = setup();

    act(() => {
      result.current.linkBiometric('ana@x.com', '123');
    });
    act(() => {
      result.current.linkBiometric('bob@x.com', '456');
    });

    expect(result.current.biometric).toEqual({
      email: 'bob@x.com',
      password: '456',
    });
  });
});
