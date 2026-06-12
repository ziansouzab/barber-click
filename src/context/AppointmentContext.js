import { createContext, useContext, useState, useMemo, useEffect } from 'react';
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

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const { user } = useAuth();

  const fetchAppointments = async () => {
    if (!user) {
      setAppointments([]);
      return;
    }
    const { data, error } = await supabase
      .from('appointments')
      .select('*, barbershops(name), profiles(name)');
    if (error) {
      console.error(error);
      return;
    }
    setAppointments((data ?? []).map(mapAppointment));
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const addAppointment = async (appointment) => {
    const { error } = await supabase.rpc('book_appointment', {
      p_barbershop_id: appointment.shopId,
      p_service_id: appointment.serviceId,
      p_date: appointment.data,
      p_time: appointment.horario,
    });
    if (error) {
      return {
        success: false,
        message: BOOKING_ERROR_MESSAGES[error.message] ?? error.message,
      };
    }
    await fetchAppointments();
    return { success: true };
  };

  const updateStatus = async (id, status) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    await fetchAppointments();
  };

  const removeAppointment = async (id) => {
    await supabase.from('appointments').delete().eq('id', id);
    await fetchAppointments();
  };

  const value = useMemo(
    () => ({
      appointments,
      addAppointment,
      updateStatus,
      removeAppointment,
      refetch: fetchAppointments,
    }),
    [appointments],
  );

  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments deve ser usado dentro de um AppointmentProvider');
  }
  return context;
}
