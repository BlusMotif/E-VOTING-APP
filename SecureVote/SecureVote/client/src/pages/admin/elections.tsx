import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminNav } from "@/components/admin-nav";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Trash2, Edit, UserPlus, BarChart, Image as ImageIcon } from "lucide-react";
import { insertCandidateSchema, insertElectionSchema } from "@shared/schema"; // Assuming insertElectionSchema is defined
import { zodResolver } from "@hookform/resolvers/zod";
import type { Election, Candidate } from "@shared/schema";

export default function ElectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: elections, isLoading } = useQuery<Election[]>({
    queryKey: ["/api/elections"],
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
    }) => {
      const res = await apiRequest("POST", "/api/elections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      toast({
        title: "Success",
        description: "Election created successfully",
      });
    },
  });

  const toggleElectionStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/elections/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      toast({
        title: "Success",
        description: "Election status updated successfully",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Elections</h1>
          <CreateElectionDialog onSubmit={createElectionMutation.mutate} />
        </div>

        <div className="grid gap-6">
          {elections?.map((election) => (
            <ElectionCard
              key={election.id}
              election={election}
              onToggleStatus={() =>
                toggleElectionStatusMutation.mutate({
                  id: election.id,
                  isActive: !election.isActive,
                })
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function CreateElectionDialog({
  onSubmit,
}: {
  onSubmit: (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
  }) => void;
}) {
  const form = useForm({
    resolver: zodResolver(insertElectionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    },
  });

  const handleSubmit = (data: any) => {
    // Format dates to ISO string before submitting
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };
    onSubmit(formattedData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Election</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              {...form.register("startDate")}
            />
            {form.formState.errors.startDate && (
              <p className="text-sm text-red-500">
                {form.formState.errors.startDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              {...form.register("endDate")}
            />
            {form.formState.errors.endDate && (
              <p className="text-sm text-red-500">
                {form.formState.errors.endDate.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Create Election
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ElectionCard({
  election,
  onToggleStatus,
}: {
  election: Election;
  onToggleStatus: () => void;
}) {
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery<Candidate[]>({
    queryKey: [`/api/elections/${election.id}/candidates`],
  });

  const addCandidateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      imageUrl?: string;
      position: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/elections/${election.id}/candidates`,
        {
          ...data,
          electionId: election.id,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/elections/${election.id}/candidates`],
      });
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      await apiRequest(
        "DELETE",
        `/api/elections/${election.id}/candidates/${candidateId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/elections/${election.id}/candidates`],
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{election.title}</CardTitle>
        <CardDescription>
          {new Date(election.startDate).toLocaleDateString()} -{" "}
          {new Date(election.endDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{election.description}</p>

        <div className="flex gap-2 mb-6">
          <Button variant="outline" onClick={onToggleStatus}>
            {election.isActive ? "End Election" : "Activate Election"}
          </Button>
          <AddCandidateDialog onSubmit={addCandidateMutation.mutate} />
          <Button variant="outline" asChild>
            <a href={`/admin/elections/${election.id}/results`} target="_blank">
              <BarChart className="w-4 h-4 mr-2" />
              View Results
            </a>
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Candidates</h3>
          {isLoadingCandidates ? (
            <div>Loading candidates...</div>
          ) : (
            <div className="grid gap-4">
              {candidates?.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  {candidate.imageUrl && (
                    <div className="w-24 h-24 relative rounded-lg overflow-hidden">
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {candidate.position}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteCandidateMutation.mutate(candidate.id)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {candidate.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddCandidateDialog({
  onSubmit,
}: {
  onSubmit: (data: { name: string; description: string; imageUrl?: string; position: string }) => void;
}) {
  const form = useForm({
    resolver: zodResolver(insertCandidateSchema.omit({ electionId: true })),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      position: "",
    },
  });

  const handleSubmit = (data: any) => {
    onSubmit({
      name: data.name,
      description: data.description,
      position: data.position,
      imageUrl: data.imageUrl || undefined, // Only include if not empty
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position/Role</Label>
            <Input id="position" {...form.register("position")} />
            {form.formState.errors.position && (
              <p className="text-sm text-red-500">
                {form.formState.errors.position.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input id="imageUrl" type="url" {...form.register("imageUrl")} />
            {form.formState.errors.imageUrl && (
              <p className="text-sm text-red-500">
                {form.formState.errors.imageUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Add Candidate
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}