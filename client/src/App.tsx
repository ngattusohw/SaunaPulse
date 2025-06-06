import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import { SocketProvider } from "./lib/socket";
import { TemperatureUnitProvider } from "./lib/temperatureUnit.tsx";
import OfflineIndicator from "@/components/OfflineIndicator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <TemperatureUnitProvider>
          <Router />
          <OfflineIndicator />
          <Toaster />
        </TemperatureUnitProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
