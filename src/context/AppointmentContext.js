import { createContext, useContext, useState, useMemo } from "react";

const AppointmentContext = createContext(undefined);

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);

  const addAppointment = (appointment) => {
    setAppointments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        status: "pendente",
        ...appointment,
      },
    ]);
  };

  const updateStatus = (id, status) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  const value = useMemo(
    () => ({ appointments, addAppointment, updateStatus }),
    [appointments],
  );

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error(
      "useAppointments deve ser usado dentro de um AppointmentProvider",
    );
  }
  return context;
}
