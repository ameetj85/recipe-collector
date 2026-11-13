'use client';
import { createContext, useContext, useState } from 'react';

// Create context
const GlobalContext = createContext();

// Create a provider
// initialUnreadCount is loaded on the server by app/layout.jsx; afterwards the
// client keeps it in sync (see components/Message.jsx).
export function GlobalProvider({ children, initialUnreadCount = 0 }) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  return (
    <GlobalContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

// Create a custom hook to access context
export function useGlobalContext() {
  return useContext(GlobalContext);
}
