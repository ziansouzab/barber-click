import { renderHook, act } from '@testing-library/react-native';
import { usePullToRefresh } from './usePullToRefresh';

jest.mock('expo-router', () => {
  const React = require('react');
  return { useFocusEffect: (callback) => React.useEffect(() => callback(), [callback]) };
});

describe('usePullToRefresh', () => {
  it('dispara o refetch ao focar a tela', () => {
    const refetch = jest.fn(() => Promise.resolve());
    renderHook(() => usePullToRefresh(refetch));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('executa o refetch e encerra com refreshing falso', async () => {
    const refetch = jest.fn(() => Promise.resolve());
    const { result } = renderHook(() => usePullToRefresh(refetch));
    await act(async () => {
      await result.current.onRefresh();
    });
    expect(refetch).toHaveBeenCalledTimes(2);
    expect(result.current.refreshing).toBe(false);
  });

  it('zera refreshing mesmo quando o refetch falha', async () => {
    const refetch = jest
      .fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('falha'));
    const { result } = renderHook(() => usePullToRefresh(refetch));
    await act(async () => {
      await result.current.onRefresh().catch(() => {});
    });
    expect(result.current.refreshing).toBe(false);
  });
});
