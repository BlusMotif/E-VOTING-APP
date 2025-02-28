import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertElectionSchema, insertCandidateSchema, insertVoteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Elections
  app.get("/api/elections", async (req, res) => {
    const elections = await storage.getElections();
    res.json(elections);
  });

  app.post("/api/elections", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const parsed = insertElectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const election = await storage.createElection({
      ...parsed.data,
      isActive: true,
    });
    await storage.createAuditLog({
      userId: req.user.id,
      action: "CREATE_ELECTION",
      details: `Created election: ${election.title}`,
    });
    res.status(201).json(election);
  });

  app.patch("/api/elections/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const election = await storage.updateElection(
      Number(req.params.id),
      req.body
    );

    await storage.createAuditLog({
      userId: req.user.id,
      action: "UPDATE_ELECTION",
      details: `Updated election: ${election.title}`,
    });

    res.json(election);
  });

  // Candidates
  app.get("/api/elections/:id/candidates", async (req, res) => {
    const candidates = await storage.getCandidatesByElection(Number(req.params.id));
    res.json(candidates);
  });

  app.post("/api/elections/:id/candidates", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const parsed = insertCandidateSchema.safeParse({
      ...req.body,
      electionId: Number(req.params.id),
    });
    if (!parsed.success) return res.status(400).json(parsed.error);

    const candidate = await storage.createCandidate(parsed.data);
    await storage.createAuditLog({
      userId: req.user.id,
      action: "CREATE_CANDIDATE",
      details: `Created candidate: ${candidate.name} for election ${candidate.electionId}`,
    });
    res.status(201).json(candidate);
  });

  app.delete("/api/elections/:electionId/candidates/:candidateId", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);

    await storage.deleteCandidate(Number(req.params.candidateId));
    await storage.createAuditLog({
      userId: req.user.id,
      action: "DELETE_CANDIDATE",
      details: `Deleted candidate ${req.params.candidateId} from election ${req.params.electionId}`,
    });
    res.sendStatus(200);
  });

  // Votes
  app.post("/api/elections/:id/vote", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const electionId = Number(req.params.id);
    const election = await storage.getElection(electionId);
    if (!election) return res.status(404).send("Election not found");

    if (!election.isActive) return res.status(400).send("Election is not active");

    const hasVoted = await storage.hasUserVoted(req.user.id, electionId);
    if (hasVoted) return res.status(400).send("Already voted in this election");

    const parsed = insertVoteSchema.safeParse({
      ...req.body,
      electionId,
    });
    if (!parsed.success) return res.status(400).json(parsed.error);

    const vote = await storage.createVote({
      ...parsed.data,
      userId: req.user.id,
    });

    await storage.createAuditLog({
      userId: req.user.id,
      action: "CAST_VOTE",
      details: `Vote cast in election ${electionId}`,
    });

    res.status(201).json(vote);
  });

  // Results
  app.get("/api/elections/:id/results", async (req, res) => {
    const electionId = Number(req.params.id);
    const election = await storage.getElection(electionId);
    if (!election) return res.status(404).send("Election not found");

    const votes = await storage.getVotesByElection(electionId);
    const candidates = await storage.getCandidatesByElection(electionId);

    const results = candidates.map(candidate => ({
      candidate,
      votes: votes.filter(vote => vote.candidateId === candidate.id).length,
    }));

    res.json({
      election,
      results,
      isPublished: !election.isActive,
    });
  });

  // Audit Logs (admin only)
  app.get("/api/audit-logs", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  const httpServer = createServer(app);
  return httpServer;
}