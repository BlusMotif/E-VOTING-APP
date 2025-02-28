import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Redirect } from "wouter";
import { AdminNav } from "@/components/admin-nav";
import { 
  Users, 
  Vote, 
  BarChart3, 
  Clock, 
  Shield, 
  ChevronRight 
} from "lucide-react";
import type { Election, AuditLog } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: elections } = useQuery<Election[]>({
    queryKey: ["/api/elections"],
  });

  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const activeElections = elections?.filter(e => e.isActive) || [];
  const completedElections = elections?.filter(e => !e.isActive) || [];

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Vote className="w-6 h-6" />}
            title="Active Elections"
            value={activeElections.length}
            description="Currently running"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="Completed Elections"
            value={completedElections.length}
            description="Past elections"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Total Voters"
            value={auditLogs?.filter(log => log.action === "CAST_VOTE").length || 0}
            description="Votes cast"
          />
          <StatCard
            icon={<Shield className="w-6 h-6" />}
            title="System Status"
            value="Secure"
            description="All systems operational"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Elections</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {elections?.map(election => (
                    <div
                      key={election.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{election.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(election.startDate).toLocaleDateString()} -{" "}
                          {new Date(election.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        election.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {election.isActive ? "Active" : "Completed"}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {auditLogs?.map(log => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 border-b pb-4 last:border-0"
                    >
                      <div className="p-2 bg-primary/10 rounded-full">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.details}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}