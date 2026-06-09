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
    const { error } = await supabase.from('appointments').insert({
      barbershop_id: appointment.shopId,
      customer_id: appointment.clienteId,
      service_id: appointment.serviceId ?? null,
      service_name: appointment.servico,
      service_price: appointment.servicePrice ?? null,
      date: appointment.data,
      time: appointment.horario,
      duration_minutes: Number(appointment.duracaoAgendamento) || 30,
    });
    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'Esse horário acabou de ser reservado. Escolha outro.' };
      }
      return { success: false, message: error.message };
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
    () => ({ appointments, addAppointment, updateStatus, removeAppointment, refetch: fetchAppointments }),
    [appointments]
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
