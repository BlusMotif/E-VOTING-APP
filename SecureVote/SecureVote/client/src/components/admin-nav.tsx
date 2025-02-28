import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Vote, LogOut } from "lucide-react";

export function AdminNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant={location === "/admin/dashboard" ? "default" : "ghost"}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/elections">
            <Button variant={location === "/admin/elections" ? "default" : "ghost"}>
              <Vote className="w-4 h-4 mr-2" />
              Manage Elections
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost">View Site</Button>
          </Link>
          <Button 
            variant="ghost" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              "Logging out..."
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
