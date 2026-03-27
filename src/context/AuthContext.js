import { createContext, useState, useContext } from 'react';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null); 
  
  const [usersDb, setUsersDb] = useState([]);

  const [biometric, setBiometric] = useState(null);
  

  const register = (email, password, name, isBarber) => {
    const userExists = usersDb.find(u => u.email === email);
    if (userExists) {
      alert('Este usuário já está cadastrado!');
      return false;
    }

    const nextId = usersDb.length > 0 ? usersDb[usersDb.length - 1].id + 1 : 1;

    const newUser = {
      id: nextId,
      name,
      email,
      password,
      isBarber,
    };


    setUsersDb([...usersDb, newUser]);
    alert('Cadastro realizado com sucesso! Agora você pode fazer o login.');
    return true;
  };

  const login = (email, password) => {
    const foundUser = usersDb.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      setUser({ id: foundUser.id, name: foundUser.name, email: foundUser.email, isBarber: foundUser.isBarber });
      return true;
    }
    
    alert('E-mail ou senha incorretos!');
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const linkBiometric = (email, password) => {
    setBiometric({email, password});
    alert("Biometria vinculada com sucesso!");
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, linkBiometric, biometric }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);