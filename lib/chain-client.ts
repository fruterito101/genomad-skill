// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - VIEM CLIENT
// Interacts with Monad blockchain
// ═══════════════════════════════════════════════════════════════════

import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type Address,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type {
  ChainConfig,
  AgentData,
  EncryptedData,
  CustodyInfo,
  BreedingRequest,
  OperationResult,
} from "./types";

// ═══════════════════════════════════════════════════════════════════
// CHAIN DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { decimals: 18, name: "Monad", symbol: "MON" },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

const monadMainnet = defineChain({
  id: 1, // TODO: Update when mainnet launches
  name: "Monad",
  nativeCurrency: { decimals: 18, name: "Monad", symbol: "MON" },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://monadexplorer.com" },
  },
});

// ═══════════════════════════════════════════════════════════════════
// CONTRACT ADDRESSES
// ═══════════════════════════════════════════════════════════════════

const CONTRACTS = {
  testnet: {
    genomadNFT: "0x190fd355ED38e82a2390C07222C4BcB4DbC4cD20" as Address,
    breedingFactory: "0x2703fb336139292c7ED854061072e316727ED7fA" as Address,
    traitVerifier: "0xaccaE8B19AD67df4Ce91638855c9B41A5Da90be3" as Address,
  },
  mainnet: {
    genomadNFT: "" as Address, // TBD
    breedingFactory: "" as Address, // TBD
  },
};

// ═══════════════════════════════════════════════════════════════════
// ABI FRAGMENTS (only what we need)
// ═══════════════════════════════════════════════════════════════════

const GENOMAD_NFT_ABI = [
  // Read functions
  {
    name: "getAgentData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "traits", type: "uint256[8]" },
          { name: "fitness", type: "uint256" },
          { name: "generation", type: "uint256" },
          { name: "parentA", type: "uint256" },
          { name: "parentB", type: "uint256" },
          { name: "dnaHash", type: "bytes32" },
          { name: "createdAt", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getEncryptedData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "soulCiphertext", type: "string" },
          { name: "identityCiphertext", type: "string" },
          { name: "nonce", type: "string" },
          { name: "lastUpdated", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getCustody",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getCustodyHolders",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "isActivated",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  // Write functions
  {
    name: "updateEncryptedData",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "soulCiphertext", type: "string" },
      { name: "identityCiphertext", type: "string" },
      { name: "nonce", type: "string" },
    ],
    outputs: [],
  },
] as const;

const BREEDING_FACTORY_ABI = [
  {
    name: "getBreedingRequest",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "parentATokenId", type: "uint256" },
          { name: "parentBTokenId", type: "uint256" },
          { name: "parentAOwner", type: "address" },
          { name: "parentBOwner", type: "address" },
          { name: "parentAApproved", type: "bool" },
          { name: "parentBApproved", type: "bool" },
          { name: "status", type: "uint8" },
          { name: "childCustodyA", type: "uint256" },
          { name: "childCustodyB", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getPendingRequests",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "approveBreeding",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "rejectBreeding",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [],
  },
] as const;

// ═══════════════════════════════════════════════════════════════════
// CHAIN CLIENT CLASS
// ═══════════════════════════════════════════════════════════════════

export class GenomadChainClient {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;
  private chain: Chain;
  private contracts: typeof CONTRACTS.testnet;
  private account: ReturnType<typeof privateKeyToAccount> | null = null;

  constructor(config: { network: "testnet" | "mainnet"; privateKey?: string }) {
    this.chain = config.network === "mainnet" ? monadMainnet : monadTestnet;
    this.contracts = CONTRACTS[config.network];

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(),
    });

    if (config.privateKey) {
      this.account = privateKeyToAccount(config.privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: this.chain,
        transport: http(),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // READ OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  async getAgentData(tokenId: number): Promise<OperationResult<AgentData>> {
    try {
      const data = await this.publicClient.readContract({
        address: this.contracts.genomadNFT,
        abi: GENOMAD_NFT_ABI,
        functionName: "getAgentData",
        args: [BigInt(tokenId)],
      });

      return {
        success: true,
        data: {
          tokenId,
          traits: (data.traits as bigint[]).map(Number),
          fitness: Number(data.fitness),
          generation: Number(data.generation),
          parentA: Number(data.parentA),
          parentB: Number(data.parentB),
          dnaHash: data.dnaHash as string,
          createdAt: Number(data.createdAt),
          isActive: data.isActive,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get agent data: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async getEncryptedData(tokenId: number): Promise<OperationResult<EncryptedData>> {
    try {
      const data = await this.publicClient.readContract({
        address: this.contracts.genomadNFT,
        abi: GENOMAD_NFT_ABI,
        functionName: "getEncryptedData",
        args: [BigInt(tokenId)],
      });

      return {
        success: true,
        data: {
          soulCiphertext: data.soulCiphertext,
          identityCiphertext: data.identityCiphertext,
          nonce: data.nonce,
          lastUpdated: Number(data.lastUpdated),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get encrypted data: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async getCustody(tokenId: number, holder: string): Promise<OperationResult<number>> {
    try {
      const bps = await this.publicClient.readContract({
        address: this.contracts.genomadNFT,
        abi: GENOMAD_NFT_ABI,
        functionName: "getCustody",
        args: [BigInt(tokenId), holder as Address],
      });

      return {
        success: true,
        data: Number(bps) / 100, // Convert bps to percentage
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get custody: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async getAllCustody(tokenId: number): Promise<OperationResult<CustodyInfo[]>> {
    try {
      const holders = await this.publicClient.readContract({
        address: this.contracts.genomadNFT,
        abi: GENOMAD_NFT_ABI,
        functionName: "getCustodyHolders",
        args: [BigInt(tokenId)],
      });

      const custodyInfo: CustodyInfo[] = [];
      for (const holder of holders as Address[]) {
        const bps = await this.publicClient.readContract({
          address: this.contracts.genomadNFT,
          abi: GENOMAD_NFT_ABI,
          functionName: "getCustody",
          args: [BigInt(tokenId), holder],
        });
        custodyInfo.push({
          holder,
          percentage: Number(bps) / 100,
        });
      }

      return { success: true, data: custodyInfo };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get all custody: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async isActivated(tokenId: number): Promise<OperationResult<boolean>> {
    try {
      const active = await this.publicClient.readContract({
        address: this.contracts.genomadNFT,
        abi: GENOMAD_NFT_ABI,
        functionName: "isActivated",
        args: [BigInt(tokenId)],
      });

      return { success: true, data: active };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check activation: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BREEDING OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  async getBreedingRequest(requestId: number): Promise<OperationResult<BreedingRequest>> {
    try {
      const data = await this.publicClient.readContract({
        address: this.contracts.breedingFactory,
        abi: BREEDING_FACTORY_ABI,
        functionName: "getBreedingRequest",
        args: [BigInt(requestId)],
      });

      const statusMap = ["pending", "approved", "rejected", "executed"] as const;

      return {
        success: true,
        data: {
          id: requestId,
          parentATokenId: Number(data.parentATokenId),
          parentBTokenId: Number(data.parentBTokenId),
          parentAOwner: data.parentAOwner,
          parentBOwner: data.parentBOwner,
          parentAApproved: data.parentAApproved,
          parentBApproved: data.parentBApproved,
          status: statusMap[Number(data.status)] || "pending",
          childCustodyA: Number(data.childCustodyA) / 100,
          childCustodyB: Number(data.childCustodyB) / 100,
          createdAt: Number(data.createdAt),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get breeding request: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async getPendingRequests(tokenId: number): Promise<OperationResult<number[]>> {
    try {
      const ids = await this.publicClient.readContract({
        address: this.contracts.breedingFactory,
        abi: BREEDING_FACTORY_ABI,
        functionName: "getPendingRequests",
        args: [BigInt(tokenId)],
      });

      return {
        success: true,
        data: (ids as bigint[]).map(Number),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get pending requests: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async approveBreeding(requestId: number): Promise<OperationResult<void>> {
    if (!this.walletClient || !this.account) {
      return { success: false, error: "Wallet not configured" };
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: this.contracts.breedingFactory,
        abi: BREEDING_FACTORY_ABI,
        functionName: "approveBreeding",
        args: [BigInt(requestId)],
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return { success: true, txHash: hash };
    } catch (error) {
      return {
        success: false,
        error: `Failed to approve breeding: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async rejectBreeding(requestId: number): Promise<OperationResult<void>> {
    if (!this.walletClient || !this.account) {
      return { success: false, error: "Wallet not configured" };
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: this.contracts.breedingFactory,
        abi: BREEDING_FACTORY_ABI,
        functionName: "rejectBreeding",
        args: [BigInt(requestId)],
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return { success: true, txHash: hash };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reject breeding: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // WRITE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  async updateEncryptedData(
    tokenId: number,
    soulCiphertext: string,
    identityCiphertext: string,
    nonce: string
  ): Promise<OperationResult<void>> {
    if (!this.walletClient || !this.account) {
      return { success: false, error: "Wallet not configured" };
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: this.contracts.genomadNFT,
        abi: GENOMAD_NFT_ABI,
        functionName: "updateEncryptedData",
        args: [BigInt(tokenId), soulCiphertext, identityCiphertext, nonce],
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      return { success: true, txHash: hash };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update encrypted data: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════════════════════════════════

  getAccountAddress(): string | null {
    return this.account?.address || null;
  }

  getChainInfo(): { name: string; id: number; rpc: string } {
    return {
      name: this.chain.name,
      id: this.chain.id,
      rpc: this.chain.rpcUrls.default.http[0],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function createChainClient(options?: {
  network?: "testnet" | "mainnet";
  privateKey?: string;
}): GenomadChainClient {
  const network = options?.network || (process.env.GENOMAD_NETWORK as "testnet" | "mainnet") || "testnet";
  const privateKey = options?.privateKey || process.env.GENOMAD_AGENT_PRIVATE_KEY;

  return new GenomadChainClient({ network, privateKey });
}
