import { renderHook, act, waitFor } from '@testing-library/react-native';
import { BarbershopProvider, useBarbershops } from './BarbershopContext';
import { supabase } from '../lib/supabase';
import { publicUrl, removeStoredImage, uploadBarbershopImage } from '../lib/storage';
import { createQueryBuilder } from '../test/supabaseMock';
import { useAuth } from './AuthContext';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

jest.mock('./AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/storage', () => ({
  publicUrl: jest.fn((bucket, path) => (path ? `https://cdn/${bucket}/${path}` : null)),
  removeStoredImage: jest.fn(() => Promise.resolve()),
  uploadBarbershopImage: jest.fn(() => Promise.resolve({ path: 'shop-1/new.jpg' })),
}));

const linhaCompleta = {
  id: 'shop-1',
  owner_id: 'owner-1',
  name: 'Barbearia X',
  description: 'a melhor',
  address: 'rua 1',
  image_path: 'shop-1/img.jpg',
  duration_minutes: 30,
  appointment_capacity: 2,
  rating: 4.5,
  latitude: -23,
  longitude: -46,
  business_hours: [{ weekday: 1, is_open: true, open_time: '09:00:00', close_time: '18:00:00' }],
  services: [{ id: 'sv1', name: 'Corte', price: 50 }],
};

const novaBarbearia = {
  owner: 'owner-1',
  name: 'Barbearia X',
  description: 'a melhor',
  endereco: 'rua 1',
  duracaoAgendamento: 30,
  appointmentCapacity: 2,
  location: { latitude: -23, longitude: -46 },
  horarios: [{ dia: 'Segunda', aberto: true, abertura: '09:00', fechamento: '18:00' }],
};

function nextFrom(...results) {
  results.forEach((result) => supabase.from.mockReturnValueOnce(createQueryBuilder(result)));
}

async function renderBarbershops() {
  const view = renderHook(() => useBarbershops(), { wrapper: BarbershopProvider });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe('BarbershopContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    supabase.from.mockReturnValue(createQueryBuilder({ data: [], error: null }));
    uploadBarbershopImage.mockResolvedValue({ path: 'shop-1/new.jpg' });
    removeStoredImage.mockResolvedValue();
    publicUrl.mockImplementation((bucket, path) => (path ? `https://cdn/${bucket}/${path}` : null));
    useAuth.mockReturnValue({ user: null });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('fetchBarbershops', () => {
    it('mapeia a linha completa para o modelo do app', async () => {
      supabase.from.mockReturnValue(createQueryBuilder({ data: [linhaCompleta], error: null }));
      const { result } = await renderBarbershops();
      expect(result.current.barbershops[0]).toMatchObject({
        id: 'shop-1',
        owner: 'owner-1',
        name: 'Barbearia X',
        endereco: 'rua 1',
        imageUri: 'https://cdn/barbershops/shop-1/img.jpg',
        duracaoAgendamento: 30,
        appointmentCapacity: 2,
        location: { latitude: -23, longitude: -46 },
        products: [{ id: 'sv1', name: 'Corte', price: 50 }],
      });
      expect(result.current.barbershops[0].horarios).toHaveLength(7);
    });

    it('usa capacidade um quando appointment_capacity e nulo', async () => {
      supabase.from.mockReturnValue(
        createQueryBuilder({ data: [{ ...linhaCompleta, appointment_capacity: null }], error: null })
      );
      const { result } = await renderBarbershops();
      expect(result.current.barbershops[0].appointmentCapacity).toBe(1);
    });

    it('deixa a localizacao nula quando nao ha latitude', async () => {
      supabase.from.mockReturnValue(
        createQueryBuilder({ data: [{ ...linhaCompleta, latitude: null }], error: null })
      );
      const { result } = await renderBarbershops();
      expect(result.current.barbershops[0].location).toBeNull();
    });

    it('aplica horarios e produtos padrao quando as relacoes faltam', async () => {
      supabase.from.mockReturnValue(
        createQueryBuilder({
          data: [{ ...linhaCompleta, business_hours: undefined, services: undefined }],
          error: null,
        })
      );
      const { result } = await renderBarbershops();
      expect(result.current.barbershops[0].horarios).toHaveLength(7);
      expect(result.current.barbershops[0].products).toEqual([]);
    });

    it('expoe a mensagem quando a busca falha', async () => {
      supabase.from.mockReturnValue(createQueryBuilder({ data: null, error: { message: 'falha' } }));
      const { result } = await renderBarbershops();
      expect(result.current.error).toBe('falha');
    });
  });

  describe('addBarbershop', () => {
    it('cria a barbearia e salva os horarios no sucesso sem imagem', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ data: { id: 'shop-1' }, error: null }, { error: null });
      let response;
      await act(async () => {
        response = await result.current.addBarbershop(novaBarbearia);
      });
      expect(response).toMatchObject({
        barbershopCreated: true,
        hoursSaved: true,
        barbershopId: 'shop-1',
      });
    });

    it('retorna falha quando o insert da barbearia falha', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ data: null, error: { message: 'insert negado' } });
      let response;
      await act(async () => {
        response = await result.current.addBarbershop(novaBarbearia);
      });
      expect(response).toEqual({
        barbershopCreated: false,
        hoursSaved: false,
        message: 'insert negado',
      });
    });

    it('sinaliza hoursSaved falso quando o insert dos horarios falha', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ data: { id: 'shop-1' }, error: null }, { error: { message: 'horas negadas' } });
      let response;
      await act(async () => {
        response = await result.current.addBarbershop(novaBarbearia);
      });
      expect(response).toMatchObject({ barbershopCreated: true, hoursSaved: false });
    });

    it('faz upload e atualiza o caminho da imagem quando ha imageUri', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ data: { id: 'shop-1' }, error: null }, { error: null }, { error: null });
      let response;
      await act(async () => {
        response = await result.current.addBarbershop({ ...novaBarbearia, imageUri: 'file://foto.jpg' });
      });
      expect(uploadBarbershopImage).toHaveBeenCalledWith('shop-1', 'file://foto.jpg');
      expect(response).toMatchObject({ barbershopCreated: true, imageSaved: true });
    });

    it('sinaliza imageSaved falso quando o upload da imagem falha', async () => {
      uploadBarbershopImage.mockRejectedValue(new Error('upload falhou'));
      const { result } = await renderBarbershops();
      nextFrom({ data: { id: 'shop-1' }, error: null }, { error: null });
      let response;
      await act(async () => {
        response = await result.current.addBarbershop({ ...novaBarbearia, imageUri: 'file://foto.jpg' });
      });
      expect(response).toMatchObject({ barbershopCreated: true, imageSaved: false });
    });

    it('reverte a imagem quando o update do caminho falha', async () => {
      const { result } = await renderBarbershops();
      nextFrom(
        { data: { id: 'shop-1' }, error: null },
        { error: { message: 'update img erro' } },
        { error: null }
      );
      let response;
      await act(async () => {
        response = await result.current.addBarbershop({ ...novaBarbearia, imageUri: 'file://foto.jpg' });
      });
      expect(response).toMatchObject({ barbershopCreated: true, imageSaved: false });
      expect(removeStoredImage).toHaveBeenCalledWith('barbershops', 'shop-1/new.jpg');
    });
  });

  describe('updateBarbershop', () => {
    it('atualiza e salva os horarios no sucesso sem nova imagem', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: null }, { error: null });
      let response;
      await act(async () => {
        response = await result.current.updateBarbershop('shop-1', novaBarbearia);
      });
      expect(response).toMatchObject({ barbershopUpdated: true, hoursSaved: true });
    });

    it('retorna falha quando o update da barbearia falha', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: { message: 'update negado' } });
      let response;
      await act(async () => {
        response = await result.current.updateBarbershop('shop-1', novaBarbearia);
      });
      expect(response).toEqual({
        barbershopUpdated: false,
        hoursSaved: false,
        message: 'update negado',
      });
    });

    it('substitui a imagem antiga ao enviar uma nova', async () => {
      const { result } = await renderBarbershops();
      nextFrom(
        { data: { image_path: 'shop-1/old.jpg' }, error: null },
        { error: null },
        { error: null }
      );
      await act(async () => {
        await result.current.updateBarbershop('shop-1', { ...novaBarbearia, imageUri: 'file://nova.jpg' });
      });
      expect(uploadBarbershopImage).toHaveBeenCalledWith('shop-1', 'file://nova.jpg');
      expect(removeStoredImage).toHaveBeenCalledWith('barbershops', 'shop-1/old.jpg');
    });

    it('sinaliza hoursSaved falso quando o upsert dos horarios falha', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: null }, { error: { message: 'horas negadas' } });
      let response;
      await act(async () => {
        response = await result.current.updateBarbershop('shop-1', novaBarbearia);
      });
      expect(response).toMatchObject({ barbershopUpdated: true, hoursSaved: false });
    });

    it('retorna falha quando nao consegue ler a imagem atual', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ data: null, error: { message: 'busca erro' } });
      let response;
      await act(async () => {
        response = await result.current.updateBarbershop('shop-1', {
          ...novaBarbearia,
          imageUri: 'file://nova.jpg',
        });
      });
      expect(response).toEqual({ barbershopUpdated: false, hoursSaved: false, message: 'busca erro' });
    });

    it('retorna falha quando o upload da nova imagem falha', async () => {
      uploadBarbershopImage.mockRejectedValue(new Error('upload falhou'));
      const { result } = await renderBarbershops();
      nextFrom({ data: { image_path: 'shop-1/old.jpg' }, error: null });
      let response;
      await act(async () => {
        response = await result.current.updateBarbershop('shop-1', {
          ...novaBarbearia,
          imageUri: 'file://nova.jpg',
        });
      });
      expect(response).toEqual({ barbershopUpdated: false, hoursSaved: false, message: 'upload falhou' });
    });
  });

  describe('produtos', () => {
    it('adiciona um produto no sucesso', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: null });
      let response;
      await act(async () => {
        response = await result.current.addProduct('shop-1', { name: 'Barba', price: 30 });
      });
      expect(response).toEqual({ success: true });
    });

    it('retorna erro ao adicionar um produto', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: { message: 'produto negado' } });
      let response;
      await act(async () => {
        response = await result.current.addProduct('shop-1', { name: 'Barba', price: 30 });
      });
      expect(response).toEqual({ success: false, message: 'produto negado' });
    });

    it('atualiza um produto no sucesso', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: null });
      let response;
      await act(async () => {
        response = await result.current.updateProduct('shop-1', 'sv1', { name: 'Corte', price: 60 });
      });
      expect(response).toEqual({ success: true });
    });

    it('remove um produto no sucesso', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: null });
      let response;
      await act(async () => {
        response = await result.current.deleteProduct('shop-1', 'sv1');
      });
      expect(response).toEqual({ success: true });
    });

    it('retorna erro ao remover um produto', async () => {
      const { result } = await renderBarbershops();
      nextFrom({ error: { message: 'remocao negada' } });
      let response;
      await act(async () => {
        response = await result.current.deleteProduct('shop-1', 'sv1');
      });
      expect(response).toEqual({ success: false, message: 'remocao negada' });
    });
  });

  describe('favoritos', () => {
    const comUsuario = () => useAuth.mockReturnValue({ user: { id: 'user-1' } });

    it('carrega os favoritos do usuario no mount', async () => {
      comUsuario();
      supabase.from.mockReturnValue(
        createQueryBuilder({ data: [{ barbershop_id: 'shop-1' }], error: null }),
      );
      const { result } = await renderBarbershops();
      await waitFor(() => expect(result.current.isFavorite('shop-1')).toBe(true));
      expect(result.current.isFavorite('shop-2')).toBe(false);
    });

    it('nao carrega favoritos quando nao ha usuario', async () => {
      const { result } = await renderBarbershops();
      expect(result.current.favoriteIds).toEqual([]);
    });

    it('exige login para favoritar', async () => {
      const { result } = await renderBarbershops();
      let response;
      await act(async () => {
        response = await result.current.toggleFavorite('shop-1');
      });
      expect(response).toEqual({ success: false, message: 'Faça login para favoritar.' });
    });

    it('adiciona aos favoritos no sucesso', async () => {
      comUsuario();
      const { result } = await renderBarbershops();
      await waitFor(() => expect(result.current.favoriteIds).toEqual([]));
      nextFrom({ error: null });
      let response;
      await act(async () => {
        response = await result.current.toggleFavorite('shop-9');
      });
      expect(response).toEqual({ success: true });
      expect(result.current.isFavorite('shop-9')).toBe(true);
    });

    it('remove dos favoritos quando ja favoritada', async () => {
      comUsuario();
      supabase.from.mockReturnValue(
        createQueryBuilder({ data: [{ barbershop_id: 'shop-1' }], error: null }),
      );
      const { result } = await renderBarbershops();
      await waitFor(() => expect(result.current.isFavorite('shop-1')).toBe(true));
      nextFrom({ error: null });
      await act(async () => {
        await result.current.toggleFavorite('shop-1');
      });
      expect(result.current.isFavorite('shop-1')).toBe(false);
    });

    it('retorna erro quando o insert do favorito falha', async () => {
      comUsuario();
      const { result } = await renderBarbershops();
      await waitFor(() => expect(result.current.favoriteIds).toEqual([]));
      nextFrom({ error: { message: 'favorito negado' } });
      let response;
      await act(async () => {
        response = await result.current.toggleFavorite('shop-9');
      });
      expect(response).toEqual({ success: false, message: 'favorito negado' });
    });

    it('coloca as favoritas no inicio da lista', async () => {
      comUsuario();
      supabase.from
        .mockReturnValueOnce(
          createQueryBuilder({
            data: [
              { ...linhaCompleta, id: 'shop-1' },
              { ...linhaCompleta, id: 'shop-2' },
            ],
            error: null,
          }),
        )
        .mockReturnValueOnce(
          createQueryBuilder({ data: [{ barbershop_id: 'shop-2' }], error: null }),
        );
      const { result } = await renderBarbershops();
      await waitFor(() => expect(result.current.isFavorite('shop-2')).toBe(true));
      expect(result.current.barbershops.map((b) => b.id)).toEqual(['shop-2', 'shop-1']);
    });
  });

  describe('rateBarbershop', () => {
    it('envia a nota e atualiza a media local', async () => {
      supabase.from.mockReturnValue(createQueryBuilder({ data: [linhaCompleta], error: null }));
      supabase.rpc.mockResolvedValue({ data: 4.8, error: null });
      const { result } = await renderBarbershops();
      let response;
      await act(async () => {
        response = await result.current.rateBarbershop('shop-1', 5);
      });
      expect(supabase.rpc).toHaveBeenCalledWith('rate_barbershop', {
        p_barbershop_id: 'shop-1',
        p_rating: 5,
      });
      expect(response).toEqual({ success: true, rating: 4.8 });
      expect(result.current.barbershops[0].rating).toBe(4.8);
    });

    it('retorna erro quando a avaliacao falha', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: 'sem atendimento' } });
      const { result } = await renderBarbershops();
      let response;
      await act(async () => {
        response = await result.current.rateBarbershop('shop-1', 5);
      });
      expect(response).toEqual({ success: false, message: 'sem atendimento' });
    });
  });

  describe('useBarbershops', () => {
    it('lanca erro quando usado fora do provider', () => {
      expect(() => renderHook(() => useBarbershops())).toThrow(
        'useBarbershops deve ser usado dentro de um BarbershopProvider'
      );
    });
  });
});
