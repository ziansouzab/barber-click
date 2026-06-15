import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createSupabaseMock } from './supabaseMock';

describe('infra de testes', () => {
  it('renderiza componentes react native', () => {
    render(<Text>barber click</Text>);
    expect(screen.getByText('barber click')).toBeOnTheScreen();
  });

  it('expoe um mock encadeavel do supabase', async () => {
    const supabase = createSupabaseMock({ rpcResult: { error: null } });
    const { error } = await supabase.rpc('book_appointment', {});
    expect(error).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith('book_appointment', {});
  });

  it('encadeia chamadas de tabela ate single', async () => {
    const supabase = createSupabaseMock({ tableResult: { data: { id: '1' }, error: null } });
    const { data } = await supabase.from('profiles').select('*').eq('id', '1').single();
    expect(data).toEqual({ id: '1' });
  });
});
