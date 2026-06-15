import {
  horarioParaMinutos,
  minutosParaHorario,
  formatarDataISO,
  formatarDataBR,
  obterNomeDia,
  obterNomeDiaCurto,
  formatarDataCurta,
  isHoje,
  temAntecedenciaMinima,
} from './datas';

describe('horarioParaMinutos', () => {
  it('converte a meia-noite em zero minutos', () => {
    expect(horarioParaMinutos('00:00')).toBe(0);
  });

  it('converte um horario intermediario', () => {
    expect(horarioParaMinutos('01:30')).toBe(90);
  });

  it('converte o ultimo minuto do dia', () => {
    expect(horarioParaMinutos('23:59')).toBe(1439);
  });
});

describe('minutosParaHorario', () => {
  it('formata zero minutos como meia-noite', () => {
    expect(minutosParaHorario(0)).toBe('00:00');
  });

  it('formata um valor intermediario com zero a esquerda', () => {
    expect(minutosParaHorario(90)).toBe('01:30');
  });

  it('formata o ultimo minuto do dia', () => {
    expect(minutosParaHorario(1439)).toBe('23:59');
  });
});

describe('formatarDataISO', () => {
  it('formata uma data com mes e dia de dois digitos', () => {
    expect(formatarDataISO(new Date(2026, 5, 12))).toBe('2026-06-12');
  });

  it('preenche mes e dia de um digito com zero a esquerda', () => {
    expect(formatarDataISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('formata o ultimo dia do ano', () => {
    expect(formatarDataISO(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('formatarDataBR', () => {
  it('inverte a data ISO para o formato brasileiro', () => {
    expect(formatarDataBR('2026-06-12')).toBe('12/06/2026');
  });

  it('mantem os zeros a esquerda', () => {
    expect(formatarDataBR('2026-01-05')).toBe('05/01/2026');
  });
});

describe('obterNomeDia', () => {
  it('reconhece um domingo', () => {
    expect(obterNomeDia('2026-06-14')).toBe('Domingo');
  });

  it('reconhece um sabado', () => {
    expect(obterNomeDia('2026-06-13')).toBe('Sábado');
  });

  it('reconhece um dia util', () => {
    expect(obterNomeDia('2026-06-12')).toBe('Sexta');
  });
});

describe('obterNomeDiaCurto', () => {
  it('abrevia o domingo', () => {
    expect(obterNomeDiaCurto('2026-06-14')).toBe('Dom');
  });

  it('abrevia o sabado', () => {
    expect(obterNomeDiaCurto('2026-06-13')).toBe('Sáb');
  });
});

describe('formatarDataCurta', () => {
  it('retorna vazio quando a data e ausente', () => {
    expect(formatarDataCurta('')).toBe('');
  });

  it('formata dia e mes a partir da data ISO', () => {
    expect(formatarDataCurta('2026-06-12')).toBe('12/06');
  });
});

describe('isHoje', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 12, 10, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reconhece a data atual', () => {
    expect(isHoje('2026-06-12')).toBe(true);
  });

  it('rejeita uma data diferente', () => {
    expect(isHoje('2026-06-14')).toBe(false);
  });
});

describe('temAntecedenciaMinima', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T12:00:00-03:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejeita quando a data esta ausente', () => {
    expect(temAntecedenciaMinima('', '14:00')).toBe(false);
  });

  it('rejeita quando o horario esta ausente', () => {
    expect(temAntecedenciaMinima('2026-06-12', '')).toBe(false);
  });

  it('rejeita uma data e horario invalidos', () => {
    expect(temAntecedenciaMinima('2026-13-40', '25:00')).toBe(false);
  });

  it('rejeita com um minuto a menos que o limite (1h59)', () => {
    expect(temAntecedenciaMinima('2026-06-12', '13:59')).toBe(false);
  });

  it('aceita exatamente no limite (2h00)', () => {
    expect(temAntecedenciaMinima('2026-06-12', '14:00')).toBe(true);
  });

  it('aceita com um minuto a mais que o limite (2h01)', () => {
    expect(temAntecedenciaMinima('2026-06-12', '14:01')).toBe(true);
  });

  it('respeita um limite de horas customizado', () => {
    expect(temAntecedenciaMinima('2026-06-12', '14:00', 3)).toBe(false);
  });
});
