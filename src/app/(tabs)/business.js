import { View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useBarbershops } from '../../context/BarbershopContext';
import { useAuth } from '../../context/AuthContext';
import { BarbershopCard } from '../../components/barbershopCard';

export default function BusinessTab() {
  const { barbershops } = useBarbershops();
  const { user } = useAuth();
  const router = useRouter();

  const userBarbershops = useMemo(() => {
    if (!barbershops || !user) return [];

    return barbershops.filter(shop => shop.owner === user.id);
  }, [barbershops, user]);

  const handleAddBarbershop = () => {
    router.push('/business/create');
  };

  const renderBarbershop = ({ item }) => (
    <BarbershopCard
      name={item.name}
      rating={item.rating}
      endereco={item.endereco}
      imageUrl={item.imageUrl}
      onPress={() => router.push(`/business/${item.id}`)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Barbearias cadastradas</Text>
        <Text style={styles.subtitle}>Gerencie seus estabelecimentos e veja como eles aparecem para os clientes.</Text>
      </View>

      {user?.isBarber && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddBarbershop} activeOpacity={0.85}>
          <Text style={styles.addButtonText}>Adicionar estabelecimento</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={userBarbershops}
        keyExtractor={(item) => item.id}
        renderItem={renderBarbershop}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum estabelecimento cadastrado ainda.</Text>
            {user?.isBarber ? (
              <Text style={styles.emptyHint}>Para adicionar, clique em "Adicionar estabelecimento"</Text>
            ) : (
              <Text style={styles.emptyHint}>Faça login como barbeiro para cadastrar um estabelecimento.</Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F1F1F'
  },
  subtitle: {
    fontSize: 14,
    color: '#5C5C5C'
  },
  addButton: {
    backgroundColor: '#0F9D58',
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: 230,
    alignSelf: 'center'
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  emptyHint: {
    fontSize: 12,
    color: '#6F6F6F',
    textAlign: 'center',
    paddingHorizontal: 24
  },
});
