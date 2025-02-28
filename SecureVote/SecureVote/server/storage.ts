import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Election, Candidate, Vote, AuditLog, InsertUser } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Election operations
  createElection(election: Omit<Election, "id">): Promise<Election>;
  getElections(): Promise<Election[]>;
  getElection(id: number): Promise<Election | undefined>;
  updateElection(id: number, election: Partial<Election>): Promise<Election>;

  // Candidate operations
  createCandidate(candidate: Omit<Candidate, "id">): Promise<Candidate>;
  getCandidatesByElection(electionId: number): Promise<Candidate[]>;
  deleteCandidate(id: number): Promise<void>;

  // Vote operations
  createVote(vote: Omit<Vote, "id" | "timestamp">): Promise<Vote>;
  getVotesByElection(electionId: number): Promise<Vote[]>;
  hasUserVoted(userId: number, electionId: number): Promise<boolean>;

  // Audit operations
  createAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private elections: Map<number, Election>;
  private candidates: Map<number, Candidate>;
  private votes: Map<number, Vote>;
  private auditLogs: Map<number, AuditLog>;
  sessionStore: session.Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.elections = new Map();
    this.candidates = new Map();
    this.votes = new Map();
    this.auditLogs = new Map();
    this.currentId = {
      users: 1,
      elections: 1,
      candidates: 1,
      votes: 1,
      auditLogs: 1,
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    // Set isAdmin to true if the username is BlusMotif
    const isAdmin = insertUser.username === "BlusMotif";
    const user: User = { ...insertUser, id, isAdmin };
    this.users.set(id, user);
    return user;
  }

  async createElection(election: Omit<Election, "id">): Promise<Election> {
    const id = this.currentId.elections++;
    const newElection: Election = { ...election, id };
    this.elections.set(id, newElection);
    return newElection;
  }

  async getElections(): Promise<Election[]> {
    return Array.from(this.elections.values());
  }

  async getElection(id: number): Promise<Election | undefined> {
    return this.elections.get(id);
  }

  async updateElection(id: number, election: Partial<Election>): Promise<Election> {
    const existing = await this.getElection(id);
    if (!existing) throw new Error("Election not found");
    const updated = { ...existing, ...election };
    this.elections.set(id, updated);
    return updated;
  }

  async createCandidate(candidate: Omit<Candidate, "id">): Promise<Candidate> {
    const id = this.currentId.candidates++;
    const newCandidate: Candidate = { ...candidate, id };
    this.candidates.set(id, newCandidate);
    return newCandidate;
  }

  async getCandidatesByElection(electionId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      (candidate) => candidate.electionId === electionId,
    );
  }

  async deleteCandidate(id: number): Promise<void> {
    this.candidates.delete(id);
  }

  async createVote(vote: Omit<Vote, "id" | "timestamp">): Promise<Vote> {
    const id = this.currentId.votes++;
    const newVote: Vote = { ...vote, id, timestamp: new Date() };
    this.votes.set(id, newVote);
    return newVote;
  }

  async getVotesByElection(electionId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.electionId === electionId,
    );
  }

  async hasUserVoted(userId: number, electionId: number): Promise<boolean> {
    return Array.from(this.votes.values()).some(
      (vote) => vote.userId === userId && vote.electionId === electionId,
    );
  }

  async createAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    const id = this.currentId.auditLogs++;
    const newLog: AuditLog = { ...log, id, timestamp: new Date() };
    this.auditLogs.set(id, newLog);
    return newLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}

export const storage = new MemStorage();