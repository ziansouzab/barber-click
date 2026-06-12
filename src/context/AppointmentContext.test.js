import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppointmentProvider, useAppointments } from './AppointmentContext';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { createQueryBuilder } from '../test/supabaseMock';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));
jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));

const novoAgendamento = {
  shopId: 'shop-1',
  serviceId: 'service-1',
  data: '2026-06-20',
  horario: '10:00',
};

async function renderAppointments() {
  const view = renderHook(() => useAppointments(), { wrapper: AppointmentProvider });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe('AppointmentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    useAuth.mockReturnValue({ user: { id: 'user-1' } });
    supabase.from.mockReturnValue(createQueryBuilder({ data: [], error: null }));
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('fetchAppointments', () => {
    it('mantem a lista vazia quando nao ha usuario', async () => {
      useAuth.mockReturnValue({ user: null });
      const { result } = await renderAppointments();
      expect(result.current.appointments).toEqual([]);
    });

    it('mapeia as linhas retornadas para o modelo do app', async () => {
      supabase.from.mockReturnValue(
        createQueryBuilder({
          data: [
            {
              id: 'a1',
              barbershop_id: 'shop-1',
              barbershops: { name: 'Barbearia X' },
              customer_id: 'c1',
              profiles: { name: 'Cliente Y' },
              service_name: 'Corte',
              date: '2026-06-20',
              time: '10:00:00',
              duration_minutes: 30,
              status: 'pendente',
              cancelled_by: null,
              cancelled_at: null,
            },
          ],
          error: null,
        })
      );
      const { result } = await renderAppointments();
      expect(result.current.appointments[0]).toEqual({
        id: 'a1',
        shopId: 'shop-1',
        shopName: 'Barbearia X',
        clienteId: 'c1',
        clienteNome: 'Cliente Y',
        servico: 'Corte',
        data: '2026-06-20',
        horario: '10:00',
        duracaoAgendamento: 30,
        status: 'pendente',
        cancelledBy: null,
        cancelledAt: null,
      });
    });

    it('usa valores padrao quando relacoes e horario estao ausentes', async () => {
      supabase.from.mockReturnValue(
        createQueryBuilder({
          data: [
            {
              id: 'a1',
              barbershop_id: 'shop-1',
              customer_id: 'c1',
              service_name: 'Corte',
              date: '2026-06-20',
              time: null,
              duration_minutes: 30,
              status: 'pendente',
            },
          ],
          error: null,
        })
      );
      const { result } = await renderAppointments();
      expect(result.current.appointments[0]).toMatchObject({
        shopName: '',
        clienteNome: '',
        horario: '',
      });
    });

    it('expoe a mensagem quando a busca falha', async () => {
      supabase.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'falha na busca' } })
      );
      const { result } = await renderAppointments();
      expect(result.current.error).toBe('falha na busca');
    });
  });

  describe('addAppointment', () => {
    it('cria o agendamento e chama a rpc com os parametros corretos', async () => {
      supabase.rpc.mockResolvedValue({ error: null });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.addAppointment(novoAgendamento);
      });
      expect(response).toEqual({ success: true });
      expect(supabase.rpc).toHaveBeenCalledWith('book_appointment', {
        p_barbershop_id: 'shop-1',
        p_service_id: 'service-1',
        p_date: '2026-06-20',
        p_time: '10:00',
      });
    });

    it('traduz o erro conhecido de capacidade atingida', async () => {
      supabase.rpc.mockResolvedValue({
        error: { message: 'This time has reached its appointment capacity.' },
      });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.addAppointment(novoAgendamento);
      });
      expect(response).toEqual({
        success: false,
        message: 'Esse horário acabou de atingir a capacidade. Escolha outro.',
      });
    });

    it('mantem a mensagem original para um erro desconhecido', async () => {
      supabase.rpc.mockResolvedValue({ error: { message: 'erro inesperado do banco' } });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.addAppointment(novoAgendamento);
      });
      expect(response).toEqual({ success: false, message: 'erro inesperado do banco' });
    });
  });

  describe('cancelAppointment', () => {
    it('cancela e chama a rpc no sucesso', async () => {
      supabase.rpc.mockResolvedValue({ error: null });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.cancelAppointment('a1');
      });
      expect(response).toEqual({ success: true });
      expect(supabase.rpc).toHaveBeenCalledWith('cancel_appointment', { p_appointment_id: 'a1' });
    });

    it('traduz o erro conhecido de antecedencia minima', async () => {
      supabase.rpc.mockResolvedValue({
        error: { message: 'Appointments must be cancelled at least two hours in advance.' },
      });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.cancelAppointment('a1');
      });
      expect(response).toEqual({
        success: false,
        message: 'O cancelamento deve ser feito com pelo menos 2 horas de antecedência.',
      });
    });

    it('mantem a mensagem original para um erro desconhecido', async () => {
      supabase.rpc.mockResolvedValue({ error: { message: 'falha qualquer' } });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.cancelAppointment('a1');
      });
      expect(response).toEqual({ success: false, message: 'falha qualquer' });
    });
  });

  describe('updateStatus', () => {
    it('atualiza o status e chama a rpc no sucesso', async () => {
      supabase.rpc.mockResolvedValue({ error: null });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.updateStatus('a1', 'aprovado');
      });
      expect(response).toEqual({ success: true });
      expect(supabase.rpc).toHaveBeenCalledWith('update_appointment_status', {
        p_appointment_id: 'a1',
        p_status: 'aprovado',
      });
    });

    it('traduz o erro conhecido de transicao invalida', async () => {
      supabase.rpc.mockResolvedValue({
        error: { message: 'Only pending appointments can be approved or rejected.' },
      });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.updateStatus('a1', 'aprovado');
      });
      expect(response).toEqual({
        success: false,
        message: 'Somente agendamentos pendentes podem ser aprovados ou recusados.',
      });
    });

    it('mantem a mensagem original para um erro desconhecido', async () => {
      supabase.rpc.mockResolvedValue({ error: { message: 'erro x' } });
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.updateStatus('a1', 'aprovado');
      });
      expect(response).toEqual({ success: false, message: 'erro x' });
    });
  });

  describe('removeAppointment', () => {
    it('remove e retorna sucesso', async () => {
      const { result } = await renderAppointments();
      let response;
      await act(async () => {
        response = await result.current.removeAppointment('a1');
      });
      expect(response).toEqual({ success: true });
    });

    it('retorna a mensagem de erro quando a remocao falha', async () => {
      const { result } = await renderAppointments();
      supabase.from.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'nao removido' } })
      );
      let response;
      await act(async () => {
        response = await result.current.removeAppointment('a1');
      });
      expect(response).toEqual({ success: false, message: 'nao removido' });
    });
  });

  describe('useAppointments', () => {
    it('lanca erro quando usado fora do provider', () => {
      expect(() => renderHook(() => useAppointments())).toThrow(
        'useAppointments deve ser usado dentro de um AppointmentProvider'
      );
    });
  });
});
