import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { BarbershopProvider } from '../context/BarbershopContext';
import { AppointmentProvider } from "../context/AppointmentContext";

export default function Layout() {
  return (
    <AuthProvider>
      <BarbershopProvider>
        <AppointmentProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AppointmentProvider>
      </BarbershopProvider>
    </AuthProvider>
  );
}
