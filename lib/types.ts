// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AgentData {
  tokenId: number;
  traits: number[];
  fitness: number;
  generation: number;
  parentA: number;
  parentB: number;
  dnaHash: string;
  createdAt: number;
  isActive: boolean;
}

export interface EncryptedData {
  soulCiphertext: string;
  identityCiphertext: string;
  nonce: string;
  lastUpdated: number;
}

export interface CustodyInfo {
  holder: string;
  percentage: number; // basis points (10000 = 100%)
}

export interface BreedingRequest {
  id: number;
  parentATokenId: number;
  parentBTokenId: number;
  parentAOwner: string;
  parentBOwner: string;
  parentAApproved: boolean;
  parentBApproved: boolean;
  status: "pending" | "approved" | "rejected" | "executed";
  childCustodyA: number; // basis points
  childCustodyB: number; // basis points
  createdAt: number;
}

export interface AgentStatus {
  tokenId: number;
  isActive: boolean;
  generation: number;
  fitness: number;
  custody: number; // percentage
  parents: { a: number; b: number };
  lastSync: number;
}

export interface ChainConfig {
  network: "testnet" | "mainnet";
  rpcUrl: string;
  chainId: number;
  contracts: {
    genomadNFT: string;
    breedingFactory: string;
  };
}

export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
}

// Trait names matching the genetic system
export const TRAIT_NAMES = [
  "technical",
  "creativity",
  "social",
  "analysis",
  "empathy",
  "trading",
  "teaching",
  "leadership",
] as const;

export type TraitName = (typeof TRAIT_NAMES)[number];

export interface Traits {
  technical: number;
  creativity: number;
  social: number;
  analysis: number;
  empathy: number;
  trading: number;
  teaching: number;
  leadership: number;
}

// Breeding rules for automatic approval
export interface BreedingRules {
  autoApprove: {
    enabled: boolean;
    minFitness: number;
    minCustody: number;
    allowedTraits: TraitName[];
    blockedAgents: number[];
  };
}
