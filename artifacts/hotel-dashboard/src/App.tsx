import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModuleProvider } from "@/context/ModuleContext";
import { AttendanceProvider } from "@/modules/attendance/AttendanceContext";
import { SalaryProvider } from "@/modules/salary/SalaryContext";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="hoteliq-theme">
      <QueryClientProvider client={queryClient}>
        <ModuleProvider>
          <DataProvider>
            <AttendanceProvider>
              <SalaryProvider>
                <TooltipProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Router />
                  </WouterRouter>
                  <Toaster />
                </TooltipProvider>
              </SalaryProvider>
            </AttendanceProvider>
          </DataProvider>
        </ModuleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
