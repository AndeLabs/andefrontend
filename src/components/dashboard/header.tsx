"use client";

import Link from "next/link";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";

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
import { Wallet, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function DashboardHeader() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect: disconnectWagmi } = useDisconnect();
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const handleLogout = async () => {
    await signOut(auth);
    // Wagmi disconnect will happen automatically if wallet is connected
    if (isConnected) {
      disconnectWagmi();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="w-full flex-1">
        {/* Can add breadcrumbs or search here */}
      </div>

      {isConnected && address ? (
         <DropdownMenu>
         <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Wallet className="h-4 w-4 mr-2" />
            <span>{formatAddress(address)}</span>
          </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           <DropdownMenuItem onClick={() => disconnectWagmi()}>
             Disconnect Wallet
           </DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>
      ) : (
        <Button variant="outline" className="h-9" onClick={() => open()}>
          <Wallet className="h-4 w-4 mr-2" />
          <span className="text-sm">Connect Wallet</span>
        </Button>
      )}

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
              <AvatarFallback>
                {user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.displayName || user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={handleLogout}>
             <LogOut className="mr-2 h-4 w-4" />
             <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
