"use client";

import { createContext, useContext } from "react";

type DashboardI18nValue = {
  language: string;
  t: (key: string, fallback?: string) => string;
};

const DashboardI18nContext = createContext<DashboardI18nValue>({
  language: "en",
  t: (_key, fallback) => fallback || "",
});

export function DashboardI18nProvider({
  value,
  children,
}: {
  value: DashboardI18nValue;
  children: React.ReactNode;
}) {
  return <DashboardI18nContext.Provider value={value}>{children}</DashboardI18nContext.Provider>;
}

export function useDashboardI18n() {
  return useContext(DashboardI18nContext);
}
