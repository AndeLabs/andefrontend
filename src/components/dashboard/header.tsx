
"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "../theme-toggle";
import { SidebarTrigger } from "../ui/sidebar";
import { WalletButton } from "../wallet-button";
import { User, LogOut, Settings, HelpCircle } from "lucide-react";
import { useWalletConnection } from "@/hooks/use-wallet-connection";

/**
 * DashboardHeader - Header del dashboard con WalletButton mejorado
 *
 * Características:
 * - Usa WalletButton con balance ANDE
 * - Network indicator
 * - Quick actions dropdown
 * - User menu
 */
export function DashboardHeader() {
  const { disconnect } = useWalletConnection();

  const handleDisconnect = () => {
    disconnect();
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <SidebarTrigger className="md:hidden" />

        <div className="w-full flex-1">
          {/* Can add breadcrumbs or search here */}
        </div>

        {/* WalletButton mejorado con balance */}
        <WalletButton
          variant="outline"
          size="default"
          showBalance={true}
          onDisconnected={() => {
            window.location.href = '/login';
          }}
        />

        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  U
                </span>
              </div>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help" className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDisconnect}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect Wallet</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </>
  );
}
