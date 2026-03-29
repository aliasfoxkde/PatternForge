import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "@/app/layout/AppLayout";

export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
