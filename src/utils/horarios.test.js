import {
  diaParaWeekday,
  weekdayParaDia,
  horariosParaRows,
  rowsParaHorarios,
} from './horarios';

describe('diaParaWeekday', () => {
  it('mapeia o domingo para zero', () => {
    expect(diaParaWeekday('Domingo')).toBe(0);
  });

  it('mapeia o sabado para seis', () => {
    expect(diaParaWeekday('Sábado')).toBe(6);
  });

  it('retorna menos um para um dia inexistente', () => {
    expect(diaParaWeekday('Feriado')).toBe(-1);
  });
});

describe('weekdayParaDia', () => {
  it('mapeia zero para domingo', () => {
    expect(weekdayParaDia(0)).toBe('Domingo');
  });

  it('mapeia seis para sabado', () => {
    expect(weekdayParaDia(6)).toBe('Sábado');
  });

  it('retorna indefinido fora do intervalo da semana', () => {
    expect(weekdayParaDia(7)).toBeUndefined();
  });
});

describe('horariosParaRows', () => {
  it('converte um dia aberto em row com horarios', () => {
    const rows = horariosParaRows('shop-1', [
      { dia: 'Segunda', aberto: true, abertura: '09:00', fechamento: '18:00' },
    ]);
    expect(rows).toEqual([
      {
        barbershop_id: 'shop-1',
        weekday: 1,
        is_open: true,
        open_time: '09:00',
        close_time: '18:00',
      },
    ]);
  });

  it('zera os horarios de um dia fechado', () => {
    const rows = horariosParaRows('shop-1', [
      { dia: 'Domingo', aberto: false, abertura: '09:00', fechamento: '18:00' },
    ]);
    expect(rows).toEqual([
      {
        barbershop_id: 'shop-1',
        weekday: 0,
        is_open: false,
        open_time: null,
        close_time: null,
      },
    ]);
  });

  it('mapeia o sabado para weekday seis', () => {
    const rows = horariosParaRows('shop-1', [
      { dia: 'Sábado', aberto: true, abertura: '08:00', fechamento: '12:00' },
    ]);
    expect(rows[0].weekday).toBe(6);
  });
});

describe('rowsParaHorarios', () => {
  it('converte uma row aberta removendo os segundos', () => {
    const horarios = rowsParaHorarios([
      { weekday: 1, is_open: true, open_time: '09:00:00', close_time: '18:00:00' },
    ]);
    expect(horarios.find((h) => h.dia === 'Segunda')).toEqual({
      dia: 'Segunda',
      aberto: true,
      abertura: '09:00',
      fechamento: '18:00',
    });
  });

  it('retorna os sete dias na ordem do app', () => {
    const horarios = rowsParaHorarios([]);
    expect(horarios).toHaveLength(7);
    expect(horarios[0].dia).toBe('Segunda');
    expect(horarios[6].dia).toBe('Domingo');
  });

  it('usa a abertura padrao quando open_time e nulo', () => {
    const horarios = rowsParaHorarios([
      { weekday: 1, is_open: true, open_time: null, close_time: '18:00:00' },
    ]);
    expect(horarios.find((h) => h.dia === 'Segunda').abertura).toBe('09:00');
  });

  it('usa o fechamento padrao quando close_time e nulo', () => {
    const horarios = rowsParaHorarios([
      { weekday: 1, is_open: true, open_time: '09:00:00', close_time: null },
    ]);
    expect(horarios.find((h) => h.dia === 'Segunda').fechamento).toBe('18:00');
  });

  it('marca como fechado um dia sem row', () => {
    const horarios = rowsParaHorarios([]);
    expect(horarios.find((h) => h.dia === 'Domingo')).toEqual({
      dia: 'Domingo',
      aberto: false,
      abertura: '09:00',
      fechamento: '18:00',
    });
  });
});
