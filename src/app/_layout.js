import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { BarbershopProvider } from '../context/BarbershopContext';

export default function Layout() {
  return (
    <AuthProvider>
      <BarbershopProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </BarbershopProvider>
    </AuthProvider>
  );
}
