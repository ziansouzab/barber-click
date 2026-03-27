import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BarbershopCard } from '../../components/barbershopCard';
import { useBarbershops } from '../../context/BarbershopContext';

export default function HomeScreen() {
  const { barbershops } = useBarbershops();
  const router = useRouter();

  const renderBarbershop = ({ item }) => (
    <BarbershopCard
      name={item.name}
      rating={item.rating}
      bairro={item.bairro}
      cidade={item.cidade}
      priceRange={item.priceRange}
      imageUrl={item.imageUrl}
      onPress={() => router.push(`/business/${item.id}`)}
    />
  );

  const getItemLayout = (data, index) => ({
    length: 112, 
    offset: 112 * index,
    index,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={barbershops}
          keyExtractor={(item) => item.id}
          renderItem={renderBarbershop}
          contentContainerStyle={styles.listContent}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 40, 
  },
});
