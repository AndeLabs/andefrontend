"use client";

import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ThemeToggle() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains('dark') ? 'dark' : 'light';
    setTheme(initialTheme);
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    window.document.documentElement.classList.toggle("dark", newTheme === "dark");
  };
  
  if (!isMounted) {
    return <Skeleton className="h-10 w-10 rounded-full" />; 
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
