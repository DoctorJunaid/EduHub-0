import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import { initTheme } from "./lib/theme";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import { InstitutionProvider } from "./context/InstitutionContext.jsx";

initTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <InstitutionProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </InstitutionProvider>
    </Provider>
  </StrictMode>,
);
