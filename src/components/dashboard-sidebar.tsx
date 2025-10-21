import Link from 'next/link';
import {
  Home,
  BarChart2,
  Settings,
  Bot,
  Filter,
  LifeBuoy,
  ShoppingBag,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Logo from '@/components/icons/logo';

const DashboardSidebar = () => {
  return (
    <Sidebar variant="inset" side="left" collapsible="icon" className="border-r border-white/10">
      <SidebarHeader className="p-4 justify-center items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-headline text-lg font-bold text-primary group-data-[collapsible=icon]:hidden">
              VORTEX
            </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <Link href="/dashboard">
                <Home />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Analytics">
              <Link href="/dashboard/analytics">
                <BarChart2 />
                <span>Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Storefront">
              <Link href="/store">
                <ShoppingBag />
                <span>Storefront</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/dashboard/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Support">
                <Link href="#">
                    <LifeBuoy />
                    <span>Support</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
