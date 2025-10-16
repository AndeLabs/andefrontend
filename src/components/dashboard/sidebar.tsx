import Link from "next/link";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Settings,
  Wallet,
  Landmark,
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
  { href: "#", icon: Landmark, label: "Staking" },
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
                isActive={item.href === "/dashboard"}
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
