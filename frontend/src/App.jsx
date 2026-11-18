import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AppRouter } from "./routes/AppRouter";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { Toaster } from "sonner";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <Toaster position="top-right" richColors closeButton />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
