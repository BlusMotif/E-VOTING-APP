import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Vote, HelpCircle, BarChart3, LogOut } from "lucide-react";
import type { Election, Candidate } from "@shared/schema";
import { apiRequest } from "@/lib/utils/api";
import { useToast } from "@/hooks/use-toast";

type ElectionResults = {
  election: Election;
  results: Array<{ candidate: Candidate; votes: number }>;
  isPublished: boolean;
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const queryClient = useQueryClient();

  const { data: elections, isLoading } = useQuery<Election[]>({
    queryKey: ["/api/elections"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading elections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">E-Voting Platform</h1>
          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Link href="/admin/dashboard">
                <Button variant="outline">Admin Dashboard</Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button
              variant="ghost"
              size="sm"
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Vote className="w-6 h-6" />}
            title="Active Elections"
            value={elections?.filter((e) => e.isActive).length || 0}
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Total Elections"
            value={elections?.length || 0}
          />
          <StatCard
            icon={<HelpCircle className="w-6 h-6" />}
            title="Help"
            value="Available"
            href="#help"
          />
        </div>

        <h2 className="text-2xl font-bold mb-6">Available Elections</h2>
        <div className="grid gap-6">
          {elections?.map((election) => (
            <ElectionCard key={election.id} election={election} />
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ElectionCard({ election }: { election: Election }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: candidates } = useQuery<Candidate[]>({
    queryKey: [`/api/elections/${election.id}/candidates`],
  });

  const { data: resultsData } = useQuery<ElectionResults>({
    queryKey: [`/api/elections/${election.id}/results`],
  });

  const voteMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      const res = await apiRequest("POST", `/api/elections/${election.id}/vote`, {
        candidateId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/elections/${election.id}/results`] });
      toast({
        title: "Vote Submitted",
        description: "Your vote has been successfully recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{election.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{election.description}</p>

        {election.isActive ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Candidates</h3>
            <div className="grid gap-4">
              {candidates?.map((candidate) => (
                <div key={candidate.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-2">
                    {candidate.imageUrl && (
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                        <img
                          src={candidate.imageUrl}
                          alt={candidate.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground">{candidate.position}</p>
                      <p className="text-sm text-muted-foreground mt-1">{candidate.description}</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-2"
                    onClick={() => voteMutation.mutate(candidate.id)}
                    disabled={voteMutation.isPending}
                  >
                    {voteMutation.isPending && voteMutation.variables === candidate.id ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⏳</span> Voting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Vote className="w-4 h-4 mr-2" /> Vote for this candidate
                      </span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold">Results</h3>
            <div className="space-y-4">
              {resultsData?.results.map(({ candidate, votes }) => (
                <div
                  key={candidate.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  {candidate.imageUrl && (
                    <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{candidate.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{votes} votes</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{candidate.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}