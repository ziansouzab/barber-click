import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useBarbershops } from "../../../context/BarbershopContext";
import { useAppointments } from "../../../context/AppointmentContext";
import { useAuth } from "../../../context/AuthContext";
import { horarioParaMinutos, minutosParaHorario, formatarDataISO, formatarDataBR, obterNomeDia, isHoje } from "../../../utils/datas";

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams();
  const { barbershops } = useBarbershops();
  const { appointments, addAppointment } = useAppointments();
  const { user } = useAuth();
  const router = useRouter();

  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horario, setHorario] = useState("");

  const shop = barbershops.find((b) => String(b.id) === String(id));

  if (!shop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Barbearia não encontrada.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const servicos = shop?.servicos ?? [];
  const duracaoAgendamento = Number(shop?.duracaoAgendamento);

  const proximasDatasDisponiveis = useMemo(() => {
    if (!shop?.horarios?.length) return [];

    const resultado = [];
    const hoje = new Date();

    for (let i = 0; i < 14; i++) {
      const data = new Date();
      data.setHours(0, 0, 0, 0);
      data.setDate(hoje.getDate() + i);

      const dataISO = formatarDataISO(data);
      const nomeDia = obterNomeDia(dataISO);
      const diaInfo = shop.horarios.find((d) => d.dia === nomeDia && d.aberto);

      if (diaInfo) {
        resultado.push({
          data: dataISO,
          abertura: diaInfo.abertura,
          fechamento: diaInfo.fechamento,
        });
      }
    }

    return resultado;
  }, [shop]);

  const horariosDisponiveis = useMemo(() => {
    const agora = new Date();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

    if (!shop || !dataSelecionada) return [];

    const abertura = horarioParaMinutos(dataSelecionada.abertura);
    const fechamento = horarioParaMinutos(dataSelecionada.fechamento);

    const horariosBase = [];

    for (
      let minutoAtual = abertura;
      minutoAtual + duracaoAgendamento <= fechamento;
      minutoAtual += duracaoAgendamento
    ) {
      horariosBase.push(minutosParaHorario(minutoAtual));
    }

    const ocupados = appointments
      .filter(
        (a) =>
          String(a.shopId) === String(shop.id) &&
          a.data === dataSelecionada.data
      )
      .map((a) => a.horario);

  return horariosBase.filter((horarioBase) => {
    const horarioOcupado = ocupados.includes(horarioBase);

    if (horarioOcupado) return false;

    if (isHoje(dataSelecionada.data)) {
      const minutosHorario = horarioParaMinutos(horarioBase);
      return minutosHorario > minutosAgora;
    }

    return true;
});
  }, [appointments, dataSelecionada, duracaoAgendamento, shop]);

  const handleSelecionarData = (dataInfo) => {
    setDataSelecionada(dataInfo);
    setHorario("");
  };

  const handleConfirmar = () => {
    if (!servicoSelecionado) {
      Alert.alert("Atenção", "Selecione um serviço.");
      return;
    }

    if (!dataSelecionada) {
      Alert.alert("Atenção", "Selecione uma data.");
      return;
    }

    if (!horario.trim()) {
      Alert.alert("Atenção", "Selecione um horário.");
      return;
    }

    if (!horariosDisponiveis.includes(horario)) {
      Alert.alert(
        "Horário indisponível",
        "Esse horário não está disponível. Por favor, tente outro horário."
      );
      return;
    }

    const resultado = addAppointment({
      shopId: shop.id,
      shopName: shop.name,
      clienteId: user.id,
      clienteNome: user.name,
      servico: servicoSelecionado,
      data: dataSelecionada.data,
      horario,
      duracaoAgendamento,
    });

    if (resultado && resultado.success === false) {
      Alert.alert("Não foi possível agendar", resultado.message);
      return;
    }

    Alert.alert("Agendamento enviado!", "Aguarde a confirmação do barbeiro.", [
      { text: "OK", onPress: () => router.replace(`/business/${id}`) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Agendar horário", headerShown: true }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.shopName}>{shop.name}</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Serviço</Text>
            <View style={styles.opcoes}>
              {servicos.map((s) => (
                <TouchableOpacity
                  key={s.nome}
                  style={[
                    styles.opcao,
                    servicoSelecionado === s.nome && styles.opcaoAtiva,
                  ]}
                  onPress={() => setServicoSelecionado(s.nome)}
                >
                  <Text
                    style={[
                      styles.opcaoText,
                      servicoSelecionado === s.nome && styles.opcaoTextAtiva,
                    ]}
                  >
                    {s.nome}
                  </Text>
                  <Text
                    style={[
                      styles.opcaoHorario,
                      servicoSelecionado === s.nome && styles.opcaoTextAtiva,
                    ]}
                  >
                    {s.preco || "A consultar"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Data</Text>
            <View style={styles.opcoes}>
              {proximasDatasDisponiveis.map((d) => {
                const selecionada = dataSelecionada?.data === d.data;

                return (
                  <TouchableOpacity
                    key={d.data}
                    style={[styles.opcao, selecionada && styles.opcaoAtiva]}
                    onPress={() => handleSelecionarData(d)}
                  >
                    <Text
                      style={[
                        styles.opcaoText,
                        selecionada && styles.opcaoTextAtiva,
                      ]}
                    >
                      {formatarDataBR(d.data)}
                    </Text>
                    <Text
                      style={[
                        styles.opcaoHorario,
                        selecionada && styles.opcaoTextAtiva,
                      ]}
                    >
                      {obterNomeDia(d.data)}
                    </Text>
                    <Text
                      style={[
                        styles.opcaoHorario,
                        selecionada && styles.opcaoTextAtiva,
                      ]}
                    >
                      {d.abertura} - {d.fechamento}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Horário desejado</Text>

            {!dataSelecionada ? (
              <Text style={styles.dica}>
                Selecione uma data para ver os horários disponíveis.
              </Text>
            ) : horariosDisponiveis.length === 0 ? (
              <Text style={styles.dica}>
                Não há horários disponíveis para esta data.
              </Text>
            ) : (
              <View style={styles.opcoes}>
                {horariosDisponiveis.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.opcao, horario === h && styles.opcaoAtiva]}
                    onPress={() => setHorario(h)}
                  >
                    <Text
                      style={[
                        styles.opcaoText,
                        horario === h && styles.opcaoTextAtiva,
                      ]}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {dataSelecionada && (
              <View>
                <Text style={styles.dica}>
                  Funcionamento em {formatarDataBR(dataSelecionada.data)} (
                  {obterNomeDia(dataSelecionada.data)}): {dataSelecionada.abertura} às{" "}
                  {dataSelecionada.fechamento}
                </Text>
                <Text style={styles.dica}>
                  Duração média de atendimento: {duracaoAgendamento} min
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.botaoConfirmar}
            onPress={handleConfirmar}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoConfirmarText}>Confirmar agendamento</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    padding: 24,
    gap: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    color: "#555",
  },
  backLink: {
    color: "#ff2a00",
    fontWeight: "600",
  },
  shopName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D1D1D",
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C3C3C",
  },
  opcoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  opcao: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  opcaoAtiva: {
    backgroundColor: "#ff2a00",
    borderColor: "#ff2a00",
  },
  opcaoText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  opcaoTextAtiva: {
    color: "#fff",
  },
  opcaoHorario: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  dica: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
  },
  botaoConfirmar: {
    backgroundColor: "#ff2a00",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  botaoConfirmarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
