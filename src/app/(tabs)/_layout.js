import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import { useBarbershops } from '../../context/BarbershopContext';

export default function TabLayout() {
  const { user } = useAuth();
  const { appointments } = useAppointments();
  const { barbershops } = useBarbershops();

  const pendingCounts = useMemo(() => {
    if (!user) return { barber: 0, customer: 0 };

    if (!user.isBarber) {
      return {
        barber: 0,
        customer: appointments.filter(
          (appointment) =>
            appointment.status === 'pendente' &&
            String(appointment.clienteId) === String(user.id)
        ).length,
      };
    }

    const ownedShopIds = new Set(
      barbershops
        .filter((barbershop) => String(barbershop.owner) === String(user.id))
        .map((barbershop) => String(barbershop.id))
    );

    return {
      barber: appointments.filter(
        (appointment) =>
          appointment.status === 'pendente' &&
          ownedShopIds.has(String(appointment.shopId))
      ).length,
      customer: 0,
    };
  }, [appointments, barbershops, user]);

  const pendingBadgeStyle = {
    backgroundColor: '#ff2a00',
    color: '#fff',
  };

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "red", headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="business"
        options={{
          title: "Estabelecimentos",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="suitcase" color={color} />
          ),
          href: user?.isBarber ? "/business" : null,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Agendamentos",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="calendar" color={color} />
          ),
          tabBarBadge: pendingCounts.barber || undefined,
          tabBarBadgeStyle: pendingBadgeStyle,
          href: user?.isBarber ? "/appointments" : null,
        }}
      />

      <Tabs.Screen
        name="myappointments"
        options={{
          title: "Meus Agendamentos",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="clock-o" color={color} />
          ),
          tabBarBadge: pendingCounts.customer || undefined,
          tabBarBadgeStyle: pendingBadgeStyle,
          href: user && !user.isBarber ? "/myappointments" : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="user" color={color} />
          ),
          href: user ? "profile" : null,
        }}
      />

      <Tabs.Screen
        name="auth"
        options={{
          title: "Entrar / Cadastrar",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="user" color={color} />
          ),
          href: !user ? "/auth" : null,
        }}
      />
    </Tabs>
  );
}
