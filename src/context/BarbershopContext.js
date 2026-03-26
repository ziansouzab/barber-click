import { createContext, useContext, useMemo, useState } from 'react';

const BarbershopContext = createContext(undefined);

export function BarbershopProvider({ children }) {
  const [barbershops, setBarbershops] = useState([]);

  const addBarbershop = (barbershop) => {
    setBarbershops((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        rating: 0,
        ...barbershop,
      },
    ]);
  };

  const value = useMemo(() => ({ barbershops, addBarbershop }), [barbershops]);

  return (
    <BarbershopContext.Provider value={value}>
      {children}
    </BarbershopContext.Provider>
  );
}

export function useBarbershops() {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershops deve ser usado dentro de um BarbershopProvider');
  }
  return context;
}
