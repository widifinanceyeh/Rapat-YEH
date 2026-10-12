import { createContext, useContext } from 'react';

export const Konteks = createContext(null);
export const useApp = () => useContext(Konteks);
