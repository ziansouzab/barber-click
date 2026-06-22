import { useState } from 'react';
import { Alert, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { CameraModal } from '../../components/CameraModal';
import { EditFieldModal } from '../../components/EditFieldModal';

export default function ProfileScreen() {
  const { user, logout, updateAvatar, updateEmail, updatePassword, deleteAccount } = useAuth();
  const router = useRouter();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)/auth');
  };

  const handleUpdateEmail = async (value) => {
    if (!value) return;
    const result = await updateEmail(value);
    if (result.success) {
      setEmailModalOpen(false);
      Alert.alert('Sucesso', 'E-mail atualizado com sucesso.');
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleUpdatePassword = async (value) => {
    if (!value) return;
    if (value.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    const result = await updatePassword(value);
    if (result.success) {
      setPasswordModalOpen(false);
      Alert.alert('Sucesso', 'Senha atualizada com sucesso.');
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Tem certeza? Essa ação é irreversível e todos os seus dados serão perdidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (!result.success) {
              Alert.alert('Erro', result.message);
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.notLoggedText}>Voce não esta logado.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(tabs)/auth')}>
            <Text style={styles.loginButtonText}>Ir para login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => setCameraOpen(true)} activeOpacity={0.8}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
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
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setEmailModalOpen(true)}
            activeOpacity={0.7}
            testID="edit-email-row"
          >
            <FontAwesome name="envelope" size={16} color="#666" />
            <Text style={styles.infoLabel}>E-mail</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
            <FontAwesome name="pencil" size={14} color="#0F9D58" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <FontAwesome name="id-badge" size={16} color="#666" />
            <Text style={styles.infoLabel}>Tipo de conta</Text>
            <Text style={styles.infoValue}>{user.isBarber ? 'Barbeiro' : 'Cliente'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setPasswordModalOpen(true)}
          activeOpacity={0.85}
          testID="change-password-button"
        >
          <FontAwesome name="lock" size={16} color="#3C3C3C" />
          <Text style={styles.actionButtonText}>Mudar senha</Text>
          <FontAwesome name="chevron-right" size={14} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <FontAwesome name="trash" size={18} color="#fff" />
          <Text style={styles.deleteButtonText}>Excluir conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <FontAwesome name="sign-out" size={18} color="#C0392B" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <CameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPhotoTaken={async (uri) => {
          setCameraOpen(false);
          const result = await updateAvatar(uri);
          if (!result.success) {
            Alert.alert('Não foi possível atualizar a foto', result.message);
          }
        }}
      />

      <EditFieldModal
        visible={emailModalOpen}
        title="Alterar e-mail"
        label="Novo e-mail"
        placeholder="Novo e-mail"
        keyboardType="email-address"
        onClose={() => setEmailModalOpen(false)}
        onSave={handleUpdateEmail}
      />

      <EditFieldModal
        visible={passwordModalOpen}
        title="Alterar senha"
        label="Nova senha"
        placeholder="Nova senha"
        secureTextEntry
        onClose={() => setPasswordModalOpen(false)}
        onSave={handleUpdatePassword}
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
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#C0392B',
    marginBottom: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
