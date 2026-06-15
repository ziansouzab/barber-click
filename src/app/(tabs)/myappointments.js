import { useState } from "react";
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../../context/AppointmentContext";
import { useAuth } from "../../context/AuthContext";
import { formatarDataBR, obterNomeDia, horarioParaMinutos, temAntecedenciaMinima } from "../../utils/datas";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

export default function MyAppointmentsScreen() {
  const { appointments, cancelAppointment, refetch } = useAppointments();
  const { user } = useAuth();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const [cancellingId, setCancellingId] = useState(null);

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

  const handleCancelAppointment = (item) => {
    Alert.alert(
      "Cancelar agendamento",
      "Deseja cancelar este agendamento? Essa ação não poderá ser desfeita.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar agendamento",
          style: "destructive",
          onPress: async () => {
            if (cancellingId) return;
            setCancellingId(item.id);
            const result = await cancelAppointment(item.id);
            setCancellingId(null);
            if (!result.success) {
              Alert.alert("Não foi possível cancelar", result.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text
          style={[
            styles.status,
            item.status === "aprovado" && styles.statusAprovado,
            item.status === "recusado" && styles.statusRecusado,
            item.status === "cancelado" && styles.statusCancelado,
          ]}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>

      <Text style={styles.info}>Serviço: {item.servico}</Text>
      <Text style={styles.info}>
        Data: {formatarDataBR(item.data)} • {obterNomeDia(item.data)} às {item.horario}
      </Text>

      {item.status === "cancelado" && (
        <Text style={styles.cancelledBy}>
          {String(item.cancelledBy) === String(user?.id)
            ? "Cancelado por você"
            : "Cancelado pela barbearia"}
        </Text>
      )}

      {(item.status === "pendente" || item.status === "aprovado") &&
        temAntecedenciaMinima(item.data, item.horario) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelAppointment(item)}
            disabled={cancellingId === item.id}
          >
            <Text style={styles.cancelButtonText}>Cancelar agendamento</Text>
          </TouchableOpacity>
        )}
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
        refreshing={refreshing}
        onRefresh={onRefresh}
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
  statusCancelado: {
    color: "#C0392B",
    backgroundColor: "#FDECEA",
  },
  cancelledBy: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#C0392B",
  },
  cancelButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#C0392B",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
