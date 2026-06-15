import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';

export default function Auth() {
  const {
    user,
    login,
    register,
    enableBiometric,
    biometricEnabled,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState('cliente');
  const [biometricSupport, setBiometricSupport] = useState(false);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]).then(([hasHardware, isEnrolled]) => {
      setBiometricSupport(hasHardware && isEnrolled);
    });
  }, []);

  useEffect(() => {
    if (user && !isProcessingLogin) {
      router.replace('/profile');
    }
  }, [user, isProcessingLogin, router]);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      alert('Para cadastro, todos os campos devem estar preenchidos!');
      return;
    }

    if (confirm !== password) {
      alert('Para cadastro, as senhas devem ser iguais!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, digite um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    const success = await register(email, password, name, selectedRole === 'barbeiro');
    if (success) {
      setIsRegistering(false);
      setPassword('');
    }
  };

  const finishLogin = () => {
    setIsProcessingLogin(false);
  };

  const promptBiometricActivation = (loggedUser) => {
    Alert.alert(
      'Acesso rápido',
      'Deseja usar sua biometria para desbloquear esta sessão nos próximos acessos?',
      [
        {
          text: 'Agora não',
          onPress: finishLogin,
        },
        {
          text: 'Ativar',
          onPress: async () => {
            const result = await enableBiometric(loggedUser.id);
            if (!result.success) Alert.alert('Biometria', result.message);
            finishLogin();
          },
        },
      ],
      { cancelable: false },
    );
  };

  const handleLogin = async () => {
    if (isProcessingLogin) return;

    if (!email || !password) {
      alert('Por favor, preencha seu e-mail e senha para entrar.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, digite um e-mail válido.');
      return;
    }

    setIsProcessingLogin(true);
    const loggedUser = await login(email, password);
    if (!loggedUser) {
      setIsProcessingLogin(false);
      return;
    }

    setPassword('');
    if (biometricSupport && !biometricEnabled) {
      promptBiometricActivation(loggedUser);
    } else {
      finishLogin();
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Image
          source={require("../../../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>{isRegistering ? 'Criar Conta' : 'Fazer Login'}</Text>

      {isRegistering && (
        <>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setSelectedRole('cliente')}
            >
              <View style={styles.radioCircle}>
                {selectedRole === 'cliente' && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>Cliente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setSelectedRole('barbeiro')}
            >
              <View style={styles.radioCircle}>
                {selectedRole === 'barbeiro' && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>Barbeiro</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Seu Nome"
            value={name}
            onChangeText={setName}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isRegistering && (
        <TextInput
        style={styles.input}
        placeholder="Confirme sua senha..."
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      )}

      <View style={styles.buttonContainer}>
        {isRegistering ? (
          <TouchableOpacity style={styles.mainButton} onPress={handleRegister}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.mainButton, isProcessingLogin && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isProcessingLogin}
          >
            <Text style={styles.buttonText}>
              {isProcessingLogin ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => setIsRegistering(!isRegistering)}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>
          {isRegistering ? 'Já tenho uma conta. Fazer Login' : 'Não tem conta? Cadastre-se'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff2a00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff2a00',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  mainButton: {
    backgroundColor: '#ff2a00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'gray',
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
});
