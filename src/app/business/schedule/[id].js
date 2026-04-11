import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useBarbershops } from "../../../context/BarbershopContext";
import { useAppointments } from "../../../context/AppointmentContext";
import { useAuth } from "../../../context/AuthContext";
import { KeyboardAvoidingView, Platform } from "react-native";



export default function ScheduleScreen() {
  const { id } = useLocalSearchParams();
  const { barbershops } = useBarbershops();
  const { appointments, addAppointment } = useAppointments();
  const { user } = useAuth();
  const router = useRouter();

  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [horario, setHorario] = useState("");

  const shop = barbershops.find((b) => b.id === id);
  const servicos = shop.servicos ?? [];
  const diasAbertos = shop.horarios?.filter((d) => d.aberto) ?? [];
  const duracaoAgendamento = Number(shop?.duracaoAgendamento);

  const horarioParaMinutos = (horario) => {
    const [hora, minuto] = horario.split(":").map(Number);
    return hora * 60 + minuto;
  };

  const minutosParaHorario = (minutos) => {
    const hora = String(Math.floor(minutos / 60)).padStart(2, "0");
    const minuto = String(minutos % 60).padStart(2, "0");
    return `${hora}:${minuto}`;
  };

  const horariosDisponiveis = useMemo(() => {
    if (!diaSelecionado) return [];

    const diaInfo = shop.horarios?.find((d) => d.dia === diaSelecionado);
    if (!diaInfo) return [];

    const abertura = horarioParaMinutos(diaInfo.abertura);
    const fechamento = horarioParaMinutos(diaInfo.fechamento);

    const horariosBase = [];

    for (
      let minutoAtual = abertura;
      minutoAtual +  duracaoAgendamento <= fechamento;
      minutoAtual += duracaoAgendamento
    ) {
      horariosBase.push(minutosParaHorario(minutoAtual));
    }

    const ocupados = appointments
      .filter(
        (a) =>
          a.shopId === shop.id &&
          a.dia === diaSelecionado &&
          a.status !== "cancelado"
      )
      .map((a) => a.horario);

    return horariosBase.filter((horarioBase) => !ocupados.includes(horarioBase));
  }, [diaSelecionado, shop, appointments, duracaoAgendamento]);

  const handleSelecionarDia = (dia) => {
    setDiaSelecionado(dia);
    setHorario("");
  }
  
  const handleConfirmar = () => {
    if (!servicoSelecionado) {
      Alert.alert("Atenção", "Selecione um serviço.");
      return;
    }
    if (!diaSelecionado) {
      Alert.alert("Atenção", "Selecione um dia.");
      return;
    }
    if (!horario.trim()) {
      Alert.alert("Atenção", "Digite o horário desejado.");
      return;
    }
    if (!horariosDisponiveis.includes(horario)) {
      Alert.alert(
        "Horário indisponível",
        "Esse horário não está disponivel. Por favor, tente outro horário."
      )
      return;
    }
    
    addAppointment({
      shopId: shop.id,
      shopName: shop.name,
      clienteId: user.id,
      clienteNome: user.name,
      servico: servicoSelecionado,
      dia: diaSelecionado, 
      horario
    });
    
    Alert.alert("Agendamento enviado!", "Aguarde a confirmação do barbeiro.", [
      { text: "OK", onPress: () => router.replace(`/business/${id}`) },
    ]);
  };

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
            <Text style={styles.label}>Dia</Text>
            <View style={styles.opcoes}>
              {diasAbertos.map((d) => (
                <TouchableOpacity
                  key={d.dia}
                  style={[
                    styles.opcao,
                    diaSelecionado === d.dia && styles.opcaoAtiva,
                  ]}
                  onPress={() => handleSelecionarDia(d.dia)}
                >
                  <Text
                    style={[
                      styles.opcaoText,
                      diaSelecionado === d.dia && styles.opcaoTextAtiva,
                    ]}
                  >
                    {d.dia}
                  </Text>
                  <Text
                    style={[
                      styles.opcaoHorario,
                      diaSelecionado === d.dia && styles.opcaoTextAtiva,
                    ]}
                  >
                    {d.abertura} - {d.fechamento}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Horário desejado</Text>
            {!diaSelecionado ? (
              <Text style={styles.dica}>Selecione um dia para ver os horários disponíveis.</Text>
            ) : horariosDisponiveis.length === 0 ? (
              <Text style={styles.dica}>Não há horários disponíveis para este dia.</Text>
            ) : (
              <View style={styles.opcoes}>
                {horariosDisponiveis.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.opcao,
                      horario === h && styles.opcaoAtiva,
                    ]}
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

            {diaSelecionado && (
              <View>
                <Text style={styles.dica}>
                  Funcionamento na {diaSelecionado}:{" "}
                  {shop.horarios?.find((d) => d.dia === diaSelecionado)?.abertura} às{" "}
                  {shop.horarios?.find((d) => d.dia === diaSelecionado)?.fechamento}
                </Text>
                <Text style={styles.dica}>
                  Duração Média de Atendimento: {duracaoAgendamento} min
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
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#222",
  },
  dica: {
    fontSize: 12,
    color: "#888",
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
