import Link from "next/link";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Settings,
  Wallet,
  Landmark,
  Gavel,
} from "lucide-react";

import { Icons } from "../icons";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/staking", icon: Landmark, label: "Staking" },
  { href: "/governance", icon: Gavel, label: "Governance" },
  { href: "#", icon: Wallet, label: "Wallets" },
  { href: "#", icon: Settings, label: "Settings" },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Icons.logo className="w-7 h-7 text-primary" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
            AndeChain
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                // This is a temporary way to show the active link.
                // We'll need a better solution with usePathname.
                isActive={typeof window !== 'undefined' && window.location.pathname.startsWith(item.href) && item.href !== '#'}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <Separator className="my-2" />
        <div className="p-4 rounded-lg bg-muted/60 text-center">
            <h3 className="font-semibold">Upgrade to Pro</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
                Unlock advanced analytics and features.
            </p>
            <Button size="sm" className="w-full">Upgrade</Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
