import { useState } from "react";
import { Menu, X } from "lucide-react";
import { RoleBasedSidebar } from "../RoleBasedSidebar";
import { CRMHeader } from "./CRMHeader";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-card border-r border-border
        flex flex-col overflow-hidden
      `}>
        <RoleBasedSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with mobile menu button */}
        <div className="bg-background border-b border-border">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <CRMHeader />
            </div>
          </div>
        </div>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}