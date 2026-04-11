import { View, Text, StyleSheet, FlatList, TouchableOpacity} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../../context/AppointmentContext";
import { useAuth } from "../../context/AuthContext";
import { useBarbershops } from "../../context/BarbershopContext";

export default function AppointmentsScreen() {
  const { appointments, updateStatus } = useAppointments();
  const { user } = useAuth();
  const { barbershops } = useBarbershops();

  const meuAgendamentos = appointments.filter((a) => {
    const shop = barbershops.find((b) => b.id === a.shopId);
    return shop?.owner === user?.id;
  });

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text
          style={[
            styles.status,
            item.status === "aprovado" && styles.statusAprovado,
            item.status === "recusado" && styles.statusRecusado,
          ]}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>

      <Text style={styles.info}>Cliente: {item.clienteNome}</Text>
      <Text style={styles.info}>Serviço: {item.servico}</Text>
      <Text style={styles.info}>
        Dia: {item.dia} às {item.horario}
      </Text>

      {item.status === "pendente" && (
        <View style={styles.acoes}>
          <TouchableOpacity
            style={[styles.botao, styles.botaoAprovar]}
            onPress={() => updateStatus(item.id, "aprovado")}
          >
            <Text style={styles.botaoText}>Aprovar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botao, styles.botaoRecusar]}
            onPress={() => updateStatus(item.id, "recusado")}
          >
            <Text style={styles.botaoText}>Recusar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Agendamentos</Text>
        <Text style={styles.subtitle}>Gerencie os pedidos recebidos.</Text>
      </View>

      <FlatList
        data={meuAgendamentos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum agendamento ainda.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F1F1F",
  },
  subtitle: {
    fontSize: 14,
    color: "#5C5C5C",
  },
  listContent: {
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D1D1D",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  statusAprovado: {
    color: "#0F9D58",
    backgroundColor: "#E8F5E9",
  },
  statusRecusado: {
    color: "#C0392B",
    backgroundColor: "#FDECEA",
  },
  info: {
    fontSize: 14,
    color: "#555",
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  botao: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  botaoAprovar: {
    backgroundColor: "#0F9D58",
  },
  botaoRecusar: {
    backgroundColor: "#C0392B",
  },
  botaoText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});
