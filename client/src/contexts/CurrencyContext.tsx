import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "CZK" | "EUR" | "USD";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amountCzk: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "CZK",
  setCurrency: () => {},
  formatPrice: (amount) => `${amount} Kč`,
});

const RATES: Record<Currency, number> = {
  CZK: 1,
  EUR: 0.04,
  USD: 0.044,
};

const SYMBOLS: Record<Currency, string> = {
  CZK: "Kč",
  EUR: "€",
  USD: "$",
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>("CZK");

  useEffect(() => {
    const saved = localStorage.getItem("app_currency") as Currency;
    if (saved && (saved === "CZK" || saved === "EUR" || saved === "USD")) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("app_currency", c);
  };

  const formatPrice = (amountCzk: number): string => {
    if (currency === "CZK") {
      return `${amountCzk} Kč`;
    }
    const converted = Math.round(amountCzk * RATES[currency] * 10) / 10;
    if (currency === "EUR") {
      return `${converted.toFixed(2)} €`;
    }
    return `$${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
