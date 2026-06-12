import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppointmentContext = createContext(undefined);

function mapAppointment(row) {
  return {
    id: row.id,
    shopId: row.barbershop_id,
    shopName: row.barbershops?.name ?? '',
    clienteId: row.customer_id,
    clienteNome: row.profiles?.name ?? '',
    servico: row.service_name,
    data: row.date,
    horario: row.time ? row.time.slice(0, 5) : '',
    duracaoAgendamento: row.duration_minutes,
    status: row.status,
    cancelledBy: row.cancelled_by,
    cancelledAt: row.cancelled_at,
  };
}

const BOOKING_ERROR_MESSAGES = {
  'This time has reached its appointment capacity.':
    'Esse horário acabou de atingir a capacidade. Escolha outro.',
  'The barbershop is closed at this time.':
    'A barbearia não atende nesse horário.',
  'Choose a future date and time.':
    'Escolha uma data e um horário futuros.',
  'Invalid service for this barbershop.':
    'O serviço selecionado não pertence a esta barbearia.',
  'Authentication is required to book an appointment.':
    'Entre na sua conta para realizar o agendamento.',
};

const STATUS_ERROR_MESSAGES = {
  'Authentication is required to update an appointment.':
    'Entre na sua conta para atualizar o agendamento.',
  'Invalid appointment status transition.':
    'Essa alteração de status não é permitida.',
  'Appointment not found.':
    'O agendamento não foi encontrado.',
  'Only the barbershop owner can update this appointment.':
    'Somente o responsável pela barbearia pode atualizar este agendamento.',
  'Only pending appointments can be approved or rejected.':
    'Somente agendamentos pendentes podem ser aprovados ou recusados.',
};

const CANCELLATION_ERROR_MESSAGES = {
  'Authentication is required to cancel an appointment.':
    'Entre na sua conta para cancelar o agendamento.',
  'Appointment not found.':
    'O agendamento não foi encontrado.',
  'You cannot cancel this appointment.':
    'Você não tem permissão para cancelar este agendamento.',
  'The barbershop can only cancel approved appointments.':
    'A barbearia só pode cancelar agendamentos aprovados.',
  'The customer can only cancel pending or approved appointments.':
    'Você só pode cancelar agendamentos pendentes ou aprovados.',
  'Appointments must be cancelled at least two hours in advance.':
    'O cancelamento deve ser feito com pelo menos 2 horas de antecedência.',
};

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('appointments')
      .select('*, barbershops(name), profiles(name)');
    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }
    setAppointments((data ?? []).map(mapAppointment));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async (appointment) => {
    const { error } = await supabase.rpc('book_appointment', {
      p_barbershop_id: appointment.shopId,
      p_service_id: appointment.serviceId,
      p_date: appointment.data,
      p_time: appointment.horario,
    });
    if (error) {
      setError(error.message);
      return {
        success: false,
        message: BOOKING_ERROR_MESSAGES[error.message] ?? error.message,
      };
    }
    await fetchAppointments();
    return { success: true };
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.rpc('update_appointment_status', {
      p_appointment_id: id,
      p_status: status,
    });
    if (error) {
      return {
        success: false,
        message: STATUS_ERROR_MESSAGES[error.message] ?? error.message,
      };
    }
    await fetchAppointments();
    return { success: true };
  };

  const cancelAppointment = async (id) => {
    const { error } = await supabase.rpc('cancel_appointment', {
      p_appointment_id: id,
    });
    if (error) {
      return {
        success: false,
        message: CANCELLATION_ERROR_MESSAGES[error.message] ?? error.message,
      };
    }
    await fetchAppointments();
    return { success: true };
  };

  const removeAppointment = async (id) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    await fetchAppointments();
    return { success: true };
  };

  const value = {
    appointments,
    loading,
    error,
    addAppointment,
    updateStatus,
    cancelAppointment,
    removeAppointment,
    refetch: fetchAppointments,
  };

  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments deve ser usado dentro de um AppointmentProvider');
  }
  return context;
}
