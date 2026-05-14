import { createContext, useContext, useState, ReactNode } from 'react';

type AppContextType = {
  selectedAppId: string | null;
  setSelectedAppId: (id: string | null) => void;
  selectedAppName: string | null;
  setSelectedAppName: (name: string | null) => void;
};

export const AppContext = createContext<AppContextType>({
  selectedAppId: null,
  setSelectedAppId: () => {},
  selectedAppName: null,
  setSelectedAppName: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppName, setSelectedAppName] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ selectedAppId, setSelectedAppId, selectedAppName, setSelectedAppName }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
