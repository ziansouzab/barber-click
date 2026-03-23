import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  
  const { user } = useAuth();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'red', headerShown: false}}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="business"
        options={{
          title: "Business",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="suitcase" color={color} />,
          href: user?.isBarber ? '/business': null
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
          href: user? 'profile' : null,
        }}
      />

      <Tabs.Screen
        name="auth"
        options={{
          title: "Entrar / Cadastrar",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
          href: !user ? '/auth': null
        }}
      />

    </Tabs>
  );
}
