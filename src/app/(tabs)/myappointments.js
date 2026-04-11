import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../../context/AppointmentContext";
import { useAuth } from "../../context/AuthContext";
import { formatarDataBR, obterNomeDia, horarioParaMinutos } from "../../utils/datas";

export default function MyAppointmentsScreen() {
  const { appointments } = useAppointments();
  const { user } = useAuth();

  const meusAgendamentos = [...appointments]
    .filter((a) => a.clienteId === user?.id)
    .sort((a, b) => {
      const dataA = a.data ?? "";
      const dataB = b.data ?? "";

      if (dataA !== dataB) {
        return dataA.localeCompare(dataB);
      }

    return horarioParaMinutos(a.horario) - horarioParaMinutos(b.horario);
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

      <Text style={styles.info}>Serviço: {item.servico}</Text>
      <Text style={styles.info}>
        Data: {formatarDataBR(item.data)} • {obterNomeDia(item.data)} às {item.horario}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Agendamentos</Text>
        <Text style={styles.subtitle}>
          Acompanhe o status dos seus pedidos.
        </Text>
      </View>

      <FlatList
        data={meusAgendamentos}
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
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});
