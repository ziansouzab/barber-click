import { renderHook, act } from '@testing-library/react-native';
import { BarbershopProvider, useBarbershops } from '../BarbershopContext';

const wrapper = ({ children }) => (
  <BarbershopProvider>{children}</BarbershopProvider>
);

const setup = () => renderHook(() => useBarbershops(), { wrapper });

const criarBarbearia = (result, dados) => {
  act(() => {
    result.current.addBarbershop(dados);
  });
  const lista = result.current.barbershops;
  return lista[lista.length - 1];
};

const adicionarProduto = (result, shopId, produto) => {
  act(() => {
    result.current.addProduct(shopId, produto);
  });
};

describe('BarbershopContext', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('addBarbershop gera id unico a partir de Date.now', () => {
    let agora = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => agora);
    const { result } = setup();

    criarBarbearia(result, { name: 'A' });
    agora = 2000;
    criarBarbearia(result, { name: 'B' });

    const ids = result.current.barbershops.map((s) => s.id);
    expect(ids).toEqual(['1000', '2000']);
  });

  test('addBarbershop inicia o rating em 0', () => {
    const { result } = setup();
    const shop = criarBarbearia(result, { name: 'Barbearia A' });

    expect(shop.rating).toBe(0);
  });

  test('addBarbershop inicia products como array vazio', () => {
    const { result } = setup();
    const shop = criarBarbearia(result, { name: 'Barbearia A' });

    expect(shop.products).toEqual([]);
  });

  test('addBarbershop permite sobrescrever os valores padrao', () => {
    const { result } = setup();
    const shop = criarBarbearia(result, { name: 'Barbearia B', rating: 4.5 });

    expect(shop.rating).toBe(4.5);
  });

  test('updateBarbershop mescla os dados quando o id casa', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'Antigo' });

    act(() => {
      result.current.updateBarbershop(id, { name: 'Novo' });
    });

    expect(result.current.barbershops[0].name).toBe('Novo');
  });

  test('updateBarbershop nao altera quando o id nao casa', () => {
    const { result } = setup();
    criarBarbearia(result, { name: 'Antigo' });

    act(() => {
      result.current.updateBarbershop('inexistente', { name: 'Novo' });
    });

    expect(result.current.barbershops[0].name).toBe('Antigo');
  });

  test('addProduct adiciona produto a barbearia correspondente', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A' });

    adicionarProduto(result, id, { name: 'Corte', price: 30 });

    const produtos = result.current.barbershops[0].products;
    expect(produtos).toHaveLength(1);
    expect(produtos[0].name).toBe('Corte');
    expect(produtos[0].id).toBeTruthy();
  });

  test('addProduct funciona quando products esta indefinido', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A', products: undefined });

    adicionarProduto(result, id, { name: 'Barba', price: 25 });

    expect(result.current.barbershops[0].products).toHaveLength(1);
  });

  test('addProduct nao altera barbearias que nao casam', () => {
    const { result } = setup();
    criarBarbearia(result, { name: 'A' });

    adicionarProduto(result, 'barbearia-inexistente', { name: 'Corte', price: 30 });

    expect(result.current.barbershops[0].products).toHaveLength(0);
  });

  test('updateProduct altera o produto quando barbearia e produto casam', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A' });
    adicionarProduto(result, id, { name: 'Corte', price: 30 });
    const produtoId = result.current.barbershops[0].products[0].id;

    act(() => {
      result.current.updateProduct(id, produtoId, { price: 40 });
    });

    expect(result.current.barbershops[0].products[0].price).toBe(40);
  });

  test('updateProduct nao altera quando o produto nao casa', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A' });
    adicionarProduto(result, id, { name: 'Corte', price: 30 });

    act(() => {
      result.current.updateProduct(id, 'produto-inexistente', { price: 99 });
    });

    expect(result.current.barbershops[0].products[0].price).toBe(30);
  });

  test('updateProduct nao altera quando a barbearia nao casa', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A' });
    adicionarProduto(result, id, { name: 'Corte', price: 30 });

    act(() => {
      result.current.updateProduct('barbearia-inexistente', 'x', { price: 99 });
    });

    expect(result.current.barbershops[0].products[0].price).toBe(30);
  });

  test('updateProduct lida com lista de produtos indefinida', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A', products: undefined });

    act(() => {
      result.current.updateProduct(id, 'qualquer', { price: 99 });
    });

    expect(result.current.barbershops[0].products).toEqual([]);
  });

  test('deleteProduct remove o produto da barbearia', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A' });
    adicionarProduto(result, id, { name: 'Corte', price: 30 });
    const produtoId = result.current.barbershops[0].products[0].id;

    act(() => {
      result.current.deleteProduct(id, produtoId);
    });

    expect(result.current.barbershops[0].products).toHaveLength(0);
  });

  test('deleteProduct ignora produto inexistente', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A' });
    adicionarProduto(result, id, { name: 'Corte', price: 30 });

    act(() => {
      result.current.deleteProduct(id, 'inexistente');
    });

    expect(result.current.barbershops[0].products).toHaveLength(1);
  });

  test('deleteProduct nao altera barbearias que nao casam', () => {
    const { result } = setup();
    const { id } = criarBarbearia(result, { name: 'A' });
    adicionarProduto(result, id, { name: 'Corte', price: 30 });

    act(() => {
      result.current.deleteProduct('barbearia-inexistente', 'x');
    });

    expect(result.current.barbershops[0].products).toHaveLength(1);
  });

  test('useBarbershops lanca erro fora do provider', () => {
    expect(() => renderHook(() => useBarbershops())).toThrow(
      'useBarbershops deve ser usado dentro de um BarbershopProvider'
    );
  });
});
