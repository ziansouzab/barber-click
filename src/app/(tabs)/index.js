import {StyleSheet, View, FlatList, TextInput, Image, Text} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo } from "react";
import { BarbershopCard } from '../../components/barbershopCard';
import { useBarbershops } from '../../context/BarbershopContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

export default function HomeScreen() {
  const { barbershops, refetch } = useBarbershops();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../../assets/splash-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Barber Click</Text>
        </View>
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
          refreshing={refreshing}
          onRefresh={onRefresh}
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
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D1D1D",
  },
});
