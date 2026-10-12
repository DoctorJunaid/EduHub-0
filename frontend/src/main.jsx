import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initTheme } from "./lib/theme";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import { InstitutionProvider } from "./context/InstitutionContext.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — data stays fresh, no re-fetch
      gcTime: 30 * 60 * 1000, // 30 min — cache retention
      refetchOnWindowFocus: false, // don't re-fetch on tab switch
      refetchOnMount: false, // don't re-fetch on remount if fresh
      refetchOnReconnect: false, // don't re-fetch on network reconnect
      retry: 1, // only one retry on failure
    },
    mutations: {
      retry: 0, // no retry on mutations
    },
  },
});

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
