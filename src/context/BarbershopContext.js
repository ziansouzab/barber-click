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
        services: [],
        products: [],
        ...barbershop,
      },
    ]);
  };

  const updateBarbershop = (id, updatedData) => {
    setBarbershops((prev) =>
      prev.map((barbershop) =>
        barbershop.id === id ? {...barbershop, ...updatedData} : barbershop
      )
    )
  }

  const addProduct = (barbershopId, product) => {
    setBarbershops((prev) =>
      prev.map((shop) =>
        shop.id === barbershopId
          ? {
              ...shop,
              products: [
                ...(shop.products || []),
                { id: String(Date.now()), ...product },
              ],
            }
          : shop
      )
    );
  };

  const updateProduct = (barbershopId, productId, changes) => {
    setBarbershops((prev) =>
      prev.map((shop) =>
        shop.id === barbershopId
          ? {
              ...shop,
              products: (shop.products || []).map((p) =>
                p.id === productId ? { ...p, ...changes } : p
              ),
            }
          : shop
      )
    );
  };

  const deleteProduct = (barbershopId, productId) => {
    setBarbershops((prev) =>
      prev.map((shop) =>
        shop.id === barbershopId
          ? {
              ...shop,
              products: (shop.products || []).filter((p) => p.id !== productId),
            }
          : shop
      )
    );
  };

  const value = useMemo(
    () => ({ barbershops, addBarbershop, updateBarbershop, addProduct, updateProduct, deleteProduct }),
    [barbershops]
  );

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
