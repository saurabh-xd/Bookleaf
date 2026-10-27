"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export const ToasterClient: React.FC = () => {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      containerStyle={{
        bottom: 32,
        right: 32,
        zIndex: 9999999,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "13px",
          fontWeight: 500,
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        },
        error: {
          style: {
            background: "#dc2626",
            color: "#ffffff",
          },
          iconTheme: {
            primary: "#ffffff",
            secondary: "#dc2626",
          },
        },
      }}
    />
  );
};
