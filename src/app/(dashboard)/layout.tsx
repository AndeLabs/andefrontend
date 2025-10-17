import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { WalletProtected } from "@/components/wallet-protected";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProtected>
      <SidebarProvider>
          <AppSidebar />
          <div className="flex flex-col flex-1">
              <DashboardHeader />
              <main className="flex-1 p-4 sm:p-6 bg-muted/20">
                  {children}
              </main>
          </div>
      </SidebarProvider>
    </WalletProtected>
  );
}
