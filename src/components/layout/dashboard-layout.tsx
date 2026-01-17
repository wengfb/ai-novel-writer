import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="border-b border-border/50 p-4">
            <SidebarTrigger />
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
