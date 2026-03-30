import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "@/app/layout/AppLayout";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { ToastContainer } from "@/shared/ui/Toast";

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppLayout />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
