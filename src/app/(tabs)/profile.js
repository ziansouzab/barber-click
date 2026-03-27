import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { CameraModal } from '../../components/CameraModal';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)/auth');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.notLoggedText}>Voce nao esta logado.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(tabs)/auth')}>
            <Text style={styles.loginButtonText}>Ir para login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => setCameraOpen(true)} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <FontAwesome name="user" size={48} color="#FFF" />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <FontAwesome name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user.name}</Text>
          {user.isBarber && (
            <View style={styles.badge}>
              <FontAwesome name="scissors" size={12} color="#0F9D58" />
              <Text style={styles.badgeText}>Barbeiro</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <FontAwesome name="envelope" size={16} color="#666" />
            <Text style={styles.infoLabel}>E-mail</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <FontAwesome name="id-badge" size={16} color="#666" />
            <Text style={styles.infoLabel}>Tipo de conta</Text>
            <Text style={styles.infoValue}>{user.isBarber ? 'Barbeiro' : 'Cliente'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <FontAwesome name="sign-out" size={18} color="#C0392B" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      <CameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPhotoTaken={(uri) => {
          setAvatarUri(uri);
          setCameraOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notLoggedText: {
    fontSize: 16,
    color: '#5C5C5C',
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#0F9D58',
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F9D58',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8F9FA',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1D',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F9D58',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C0392B',
  },
});
