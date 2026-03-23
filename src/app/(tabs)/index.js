import { StyleSheet, View, FlatList} from 'react-native';
import { BarbershopCard } from '../../components/barbershopCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_BARBERSHOPS = [
  {
    id: '1',
    name: 'Barbearia do Igão',
    rating: 4.8,
    bairro: "Centro",
    cidade: "Vassouras",
    priceRange: '$$',
    imageUrl: '../../assets/icon.png',
  },
  {
    id: '2',
    name: 'Barbearia do Helinho',
    rating: 4.5,
    bairro: "Centro",
    cidade: "Pirai",
    priceRange: '$$',
    imageUrl: '../../assets/icon.png',
  },
];

export default function HomeScreen() {
  const renderBarbershop = ({ item }) => (
    <BarbershopCard
      name={item.name}
      rating={item.rating}
      bairro={item.bairro}
      cidade={item.cidade}
      priceRange={item.priceRange}
      imageUrl={item.imageUrl}
      onPress={() => alert(`Navegar para a barbearia: ${item.id}`)}
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
          data={MOCK_BARBERSHOPS}
          keyExtractor={(item) => item.id}
          renderItem={renderBarbershop}
          contentContainerStyle={styles.listContent}
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
