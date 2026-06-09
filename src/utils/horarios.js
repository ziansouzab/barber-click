const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const ORDEM_APP = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export function diaParaWeekday(dia) {
  return DIAS_SEMANA.indexOf(dia);
}

export function weekdayParaDia(weekday) {
  return DIAS_SEMANA[weekday];
}

export function horariosParaRows(barbershopId, horarios) {
  return horarios.map((h) => ({
    barbershop_id: barbershopId,
    weekday: diaParaWeekday(h.dia),
    is_open: h.aberto,
    open_time: h.aberto ? h.abertura : null,
    close_time: h.aberto ? h.fechamento : null,
  }));
}

export function rowsParaHorarios(rows) {
  const porDia = {};
  for (const row of rows) {
    porDia[weekdayParaDia(row.weekday)] = row;
  }
  return ORDEM_APP.map((dia) => {
    const row = porDia[dia];
    return {
      dia,
      aberto: row ? row.is_open : false,
      abertura: row?.open_time ? row.open_time.slice(0, 5) : '09:00',
      fechamento: row?.close_time ? row.close_time.slice(0, 5) : '18:00',
    };
  });
}
