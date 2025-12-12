import React, { createContext, useState, ReactNode } from "react";

type GlobalContextType = {
  userData: any;
  setUserData: (data: any) => void;
  bookingsData: any[];
  setBookingsData: (data: any[]) => void;
};

export const GlobalContext = createContext<GlobalContextType>({
  userData: {},
  setUserData: () => {},
  bookingsData: [],
  setBookingsData: () => {},
});

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<any>({});
  const [bookingsData, setBookingsData] = useState<any[]>([]);

  return (
    <GlobalContext.Provider value={{ userData, setUserData, bookingsData, setBookingsData }}>
      {children}
    </GlobalContext.Provider>
  );
};
