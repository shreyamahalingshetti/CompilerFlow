"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { 
  Code2, 
  TerminalSquare, 
  FileText, 
  Share2, 
  PlayCircle, 
  BookOpen, 
  Sun, 
  Moon,
  Workflow
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  const navLinks = [
    { name: "Editor", path: "/editor", icon: Code2 },
    { name: "Lexer", path: "/lexer", icon: TerminalSquare },
    { name: "Parser", path: "/parser", icon: FileText },
    { name: "Parse Tree", path: "/tree", icon: Share2 },
    { name: "Codegen", path: "/codegen", icon: Code2 },
    { name: "Execute", path: "/output", icon: PlayCircle },
    { name: "Docs", path: "/docs", icon: BookOpen },
  ];

  const getStepIndex = (path: string) => {
    return navLinks.findIndex(l => l.path === path);
  };

  const currentStepIndex = getStepIndex(pathname);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 lg:py-0 lg:h-16 gap-3 lg:gap-0">
          
          {/* Logo & Theme Toggle */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <Workflow className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                CompilerFlow
              </span>
            </Link>
            
            {/* Theme Toggle Button for Mobile/All */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="lg:hidden p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Compiler Pipeline Links */}
          <div className="w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <div className="flex items-center space-x-1 min-w-max">
              {navLinks.map((link, idx) => {
                const isActive = pathname === link.path;
                const isVisited = currentStepIndex >= idx;
                const Icon = link.icon;
                
                return (
                  <div key={link.path} className="flex items-center">
                    {/* Connection Line */}
                    {idx > 0 && (
                      <div className={`w-4 h-0.5 mx-1 transition-colors duration-300 ${
                        isVisited 
                          ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
                          : "bg-zinc-300 dark:bg-zinc-800"
                      }`} />
                    )}

                    <Link
                      href={link.path}
                      className={`relative px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                        isActive 
                          ? "text-blue-500 dark:text-blue-400 bg-blue-500/10" 
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 transition-colors ${
                          isActive ? "text-blue-500" : isVisited ? "text-indigo-400" : "text-zinc-400"
                        }`} />
                        <span>{link.name}</span>
                      </div>
                      
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.6)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Theme Toggle */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
