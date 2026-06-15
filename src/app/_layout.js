import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { BarbershopProvider } from '../context/BarbershopContext';
import { AppointmentProvider } from '../context/AppointmentContext';

function AppContent() {
  const { loading, isBiometricLocked, unlockBiometric, logout } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff2a00" />
      </View>
    );
  }

  if (isBiometricLocked) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Sessão bloqueada</Text>
        <Text style={styles.description}>Confirme sua biometria para continuar.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={unlockBiometric}>
          <Text style={styles.primaryButtonText}>Desbloquear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={logout}>
          <Text style={styles.secondaryButtonText}>Entrar com outra conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <BarbershopProvider>
      <AppointmentProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AppointmentProvider>
    </BarbershopProvider>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#ff2a00',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 18,
    padding: 8,
  },
  secondaryButtonText: {
    color: '#666',
  },
});
