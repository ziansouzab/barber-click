export const horarioParaMinutos = (horario) => {
    const [hora, minuto] = horario.split(":").map(Number);
    return hora * 60 + minuto;
  };

export const minutosParaHorario = (minutos) => {
    const hora = String(Math.floor(minutos / 60)).padStart(2, "0");
    const minuto = String(minutos % 60).padStart(2, "0");
    return `${hora}:${minuto}`;
  };

export const formatarDataISO = (date) => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

export const formatarDataBR = (dataISO) => {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
};

export const obterNomeDia = (dataISO) => {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  const dias = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  return dias[data.getDay()];
};

export const obterNomeDiaCurto = (dataISO) => {
  const nome = obterNomeDia(dataISO);

  const mapa = {
    Domingo: "Dom",
    Segunda: "Seg",
    Terça: "Ter",
    Quarta: "Qua",
    Quinta: "Qui",
    Sexta: "Sex",
    Sábado: "Sáb",
  };

  return mapa[nome] ?? nome;
};

export const formatarDataCurta = (dataISO) => {
  if (!dataISO) return "";

  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
};

export const isHoje = (dataISO) => {
  const hoje = new Date();
  const hojeISO = formatarDataISO(hoje);
  return dataISO === hojeISO;
};

export const temAntecedenciaMinima = (dataISO, horario, horas = 2) => {
  if (!dataISO || !horario) return false;

  const dataAgendamento = new Date(`${dataISO}T${horario}:00-03:00`);
  if (Number.isNaN(dataAgendamento.getTime())) return false;

  return dataAgendamento.getTime() - Date.now() >= horas * 60 * 60 * 1000;
};
