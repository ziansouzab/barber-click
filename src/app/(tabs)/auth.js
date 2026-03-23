import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

export default function Auth() {
  const { user, login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState('cliente');

  if (user) {
    return <Redirect href="/" />;
  }

  const handleRegister = () => {
    if (!email || !password || !name) {
      alert("Para cadastro, todos os campos devem estar preenchidos!");
      return;
    }

    const isBarber = selectedRole === 'barbeiro';
    
    const success = register(email, password, name, isBarber);

    if (success) {
      setIsRegistering(false);
      setPassword(''); 
    }
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.buttonContainer}>
        {isRegistering ? (
          <TouchableOpacity style={styles.mainButton} onPress={handleRegister}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.mainButton} onPress={() => login(email, password)}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.secondaryButton}>
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
    gap: 10 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
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
});