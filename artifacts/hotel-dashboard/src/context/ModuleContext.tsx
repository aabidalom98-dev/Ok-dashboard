import { createContext, useContext, useState, ReactNode } from 'react';

export type Module = 'hotel' | 'attendance' | 'salary' | 'salary-slip';

interface ModuleContextType {
  activeModule: Module;
  setActiveModule: (m: Module) => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<Module>('hotel');
  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error('useModule must be used within ModuleProvider');
  return ctx;
}
