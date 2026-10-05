"use client";

import { YMInitializer } from "react-yandex-metrika";
import { ENABLE_METRIC } from "./constants";

const YM_COUNTER_ID = 89187152;

export const YandexMetrika = () => {
  if (!ENABLE_METRIC) {
    return null;
  }

  return (
    <YMInitializer
      accounts={[YM_COUNTER_ID]}
      options={{
        defer: true,
        webvisor: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        ecommerce:"dataLayer"
      }}
      version="2"
    />
  );
};
