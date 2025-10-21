import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import CommandMenu from '@/components/command-menu';
import { CommandMenuProvider } from '@/hooks/use-command-menu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandMenuProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
        <CommandMenu />
      </SidebarProvider>
    </CommandMenuProvider>
  );
}
