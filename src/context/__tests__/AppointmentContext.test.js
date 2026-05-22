import { renderHook, act } from '@testing-library/react-native';
import { AppointmentProvider, useAppointments } from '../AppointmentContext';

const wrapper = ({ children }) => (
  <AppointmentProvider>{children}</AppointmentProvider>
);

const setup = () => renderHook(() => useAppointments(), { wrapper });

const adicionarAgendamento = (result, dados) => {
  act(() => {
    result.current.addAppointment(dados);
  });
  const agendamentos = result.current.appointments;
  return agendamentos[agendamentos.length - 1];
};

describe('Agendamento', () => {
  test('addAppointment cria um agendamento com status pendente e id gerado', () => {
    const { result } = setup();
    const agendamento = adicionarAgendamento(result, { servico: 'Corte' });

    expect(result.current.appointments).toHaveLength(1);
    expect(agendamento.status).toBe('pendente');
    expect(agendamento.servico).toBe('Corte');
    expect(agendamento.id).toBeTruthy();
  });

  test('addAppointment permite sobrescrever o status padrao do agendamento', () => {
    const { result } = setup();
    const agendamento = adicionarAgendamento(result, {
      servico: 'Barba',
      status: 'aprovado',
    });

    expect(agendamento.status).toBe('aprovado');
  });

  test('updateStatus altera o status do agendamento quando o id casa', () => {
    const { result } = setup();
    const { id } = adicionarAgendamento(result, { servico: 'Corte' });

    act(() => {
      result.current.updateStatus(id, 'aprovado');
    });

    expect(result.current.appointments[0].status).toBe('aprovado');
  });

  test('updateStatus mantem o agendamento quando o id nao casa', () => {
    const { result } = setup();
    adicionarAgendamento(result, { servico: 'Corte' });

    act(() => {
      result.current.updateStatus('inexistente', 'aprovado');
    });

    expect(result.current.appointments[0].status).toBe('pendente');
  });

  test('removeAppointment remove o agendamento pelo id', () => {
    const { result } = setup();
    const { id } = adicionarAgendamento(result, { servico: 'Corte' });

    act(() => {
      result.current.removeAppointment(id);
    });

    expect(result.current.appointments).toHaveLength(0);
  });

  test('removeAppointment ignora id de agendamento inexistente', () => {
    const { result } = setup();
    adicionarAgendamento(result, { servico: 'Corte' });

    act(() => {
      result.current.removeAppointment('inexistente');
    });

    expect(result.current.appointments).toHaveLength(1);
  });

  test('useAppointments lanca erro fora do provider', () => {
    expect(() => renderHook(() => useAppointments())).toThrow(
      'useAppointments deve ser usado dentro de um AppointmentProvider'
    );
  });
});
