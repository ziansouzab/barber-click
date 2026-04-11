import { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../../context/AppointmentContext";
import { useAuth } from "../../context/AuthContext";
import { useBarbershops } from "../../context/BarbershopContext";
import { horarioParaMinutos, formatarDataBR, obterNomeDia, obterNomeDiaCurto, formatarDataCurta, formatarDataISO } from "../../utils/datas";


export default function AppointmentsScreen() {
  const { appointments, updateStatus, removeAppointment } = useAppointments();
  const { user } = useAuth();
  const { barbershops } = useBarbershops();
  const [dataFiltro, setDataFiltro] = useState("Todos");

  const minhasBarbearias = useMemo(() => {
    return barbershops.filter(
      (b) => String(b.owner) === String(user?.id)
    );
  }, [barbershops, user]);

  const datasFiltro = useMemo(() => {
    if (!minhasBarbearias.length) return [];

    const hoje = new Date();
    const lista = [];

    for (let i = 0; i < 14 && lista.length < 7; i++) {
      const data = new Date();
      data.setHours(0, 0, 0, 0);
      data.setDate(hoje.getDate() + i);

      const dataISO = formatarDataISO(data);
      const nomeDia = obterNomeDia(dataISO);

      const algumaBarbeariaAbreNesseDia = minhasBarbearias.some((shop) =>
        shop.horarios?.some((h) => h.dia === nomeDia && h.aberto)
      );

      if (algumaBarbeariaAbreNesseDia) {
        lista.push({
          value: dataISO,
          label: `${obterNomeDiaCurto(dataISO)} • ${formatarDataCurta(dataISO)}`,
        });
      }
    }

    return lista;
  }, [minhasBarbearias]);

  const ordenarAgendamentos = (lista) => {
    return [...lista].sort((a, b) => {
      const dataA = a.data ?? "";
      const dataB = b.data ?? "";

      if (dataA !== dataB) {
        return dataA.localeCompare(dataB);
      }

      return horarioParaMinutos(a.horario) - horarioParaMinutos(b.horario);
    });
  };

  const meusAgendamentos = useMemo(() => {
    const lista = appointments.filter((a) => {
      const shop = barbershops.find((b) => String(b.id) === String(a.shopId));
      return String(shop?.owner) === String(user?.id);
    });

    return ordenarAgendamentos(lista);
  }, [appointments, barbershops, user]);

  const pendentes = useMemo(() => {
    const listaPendentes = meusAgendamentos.filter((a) => a.status === "pendente");
    return ordenarAgendamentos(listaPendentes);
  }, [meusAgendamentos]);

  const agendamentosFiltrados = useMemo(() => {
    const somenteAprovados = meusAgendamentos.filter((a) => a.status === "aprovado");

    const base =
      dataFiltro === "Todos"
        ? somenteAprovados
        : somenteAprovados.filter((a) => a.data === dataFiltro);

    return ordenarAgendamentos(base);
  }, [meusAgendamentos, dataFiltro]);

  const renderStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderAppointmentCard = (item, isPendingSection = false) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text
          style={[
            styles.status,
            item.status === "aprovado" && styles.statusAprovado,
            item.status === "pendente" && styles.statusPendente,
          ]}
        >
          {renderStatusLabel(item.status)}
        </Text>
      </View>

      <Text style={styles.info}>Cliente: {item.clienteNome}</Text>
      <Text style={styles.info}>Serviço: {item.servico}</Text>
      <Text style={styles.info}>
        Data: {formatarDataBR(item.data)} • {obterNomeDia(item.data)}
      </Text>
      <Text style={styles.info}>Horário: {item.horario}</Text>

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
            onPress={() => removeAppointment(item.id)}
          >
            <Text style={styles.botaoText}>Recusar</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPendingSection && (
        <Text style={styles.pendingHint}>
          Esse pedido está aguardando sua decisão.
        </Text>
      )}
    </View>
  );

  const tituloAgenda =
    dataFiltro === "Todos"
      ? "Agenda aprovada"
      : `Agendamentos de ${obterNomeDia(dataFiltro)} • ${formatarDataBR(dataFiltro)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={agendamentosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderAppointmentCard(item)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Agendamentos</Text>
              <Text style={styles.subtitle}>
                Gerencie os pedidos recebidos e acompanhe sua agenda semanal.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Pendentes de aceitar</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendentes.length}</Text>
                </View>
              </View>

              {pendentes.length === 0 ? (
                <View style={styles.emptySmallContainer}>
                  <Text style={styles.emptySmallText}>
                    Nenhum pedido pendente no momento.
                  </Text>
                </View>
              ) : (
                <View style={styles.pendingList}>
                  {pendentes.map((item) => (
                    <View key={item.id}>
                      {renderAppointmentCard(item, true)}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filtrar agenda por dia</Text>

              <View style={styles.filtersContainer}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      dataFiltro === "Todos" && styles.filterChipActive,
                    ]}
                    onPress={() => setDataFiltro("Todos")}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        dataFiltro === "Todos" && styles.filterChipTextActive,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>

                  {datasFiltro.map((dataItem) => (
                    <TouchableOpacity
                      key={dataItem.value}
                      style={[
                        styles.filterChip,
                        dataFiltro === dataItem.value && styles.filterChipActive,
                      ]}
                      onPress={() => setDataFiltro(dataItem.value)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          dataFiltro === dataItem.value && styles.filterChipTextActive,
                        ]}
                      >
                        {dataItem.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{tituloAgenda}</Text>
              </View>
            </>
          }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum agendamento aprovado encontrado para este filtro.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
  listContent: {
    paddingBottom: 32,
    paddingTop: 8,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
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
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1D1D",
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ff2a00",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  pendingList: {
    gap: 12,
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    backgroundColor: "#ff2a00",
    borderColor: "#ff2a00",
  },
  filterChipText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
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
    gap: 10,
  },
  shopName: {
    flex: 1,
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
  statusPendente: {
    color: "#B26A00",
    backgroundColor: "#FFF4E5",
  },
  statusAprovado: {
    color: "#0F9D58",
    backgroundColor: "#E8F5E9",
  },
  info: {
    fontSize: 14,
    color: "#555",
  },
  pendingHint: {
    fontSize: 12,
    color: "#B26A00",
    marginTop: 4,
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
    textAlign: "center",
  },
  emptySmallContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    alignItems: "center",
  },
  emptySmallText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});