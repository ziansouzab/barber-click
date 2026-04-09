import { StyleSheet, View, FlatList, TextInput } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo } from "react";
import { BarbershopCard } from '../../components/BarbershopCard';
import { useBarbershops } from '../../context/BarbershopContext';

export default function HomeScreen() {
  const { barbershops } = useBarbershops();
  const router = useRouter();

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return barbershops;
    const term = search.toLowerCase();
    return barbershops.filter(
      (b) =>
        b.name?.toLowerCase().includes(term)
    );
  }, [search, barbershops]);

  const renderBarbershop = ({ item }) => (
    <BarbershopCard
      name={item.name}
      rating={item.rating}
      endereco={item.endereco}
      imageUri={item.imageUri}
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
        <TextInput
          style={styles.search}
          placeholder="Buscar barbearia..."
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <FlatList
          data={filtered} 
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
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },

  search: {
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#222",
  },

  listContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
});
