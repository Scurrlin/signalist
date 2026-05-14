"use client";

import dynamic from "next/dynamic";

const LazyStockDetailsClient = dynamic(() => import("./StockDetailsClient"), {
  ssr: false,
  loading: () => null,
});

export default LazyStockDetailsClient;
