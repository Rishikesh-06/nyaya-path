import { ethers } from 'ethers';

const CASE_STORAGE_ABI = [
  "function storeHash(uint256 caseId, bytes32 hash) public",
  "function getHash(uint256 caseId) public view returns (bytes32)"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contractViewOnly: boolean = true;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      // In Vite we use import.meta.env
      // BUT NEVER EXPOSE PRIVATE_KEY TO VITE! That's why this is mostly for the edge function
      // and read-only for the frontend.
      const rpcUrl = import.meta.env?.VITE_POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com/';
      const contractAddress = import.meta.env?.VITE_CONTRACT_ADDRESS || ethers.ZeroAddress;

      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // We only setup a readonly contract on the frontend.
      this.contract = new ethers.Contract(contractAddress, CASE_STORAGE_ABI, this.provider);
      this.isConfigured = true;
    } catch (e) {
      console.warn("Blockchain Service initialized in a non-browser or non-standard environment.");
    }
  }

  private uuidToUint256(uuid: string): bigint {
    const hex = uuid.replace(/-/g, '');
    return BigInt('0x' + hex);
  }

  // The storing logic will only be executed from the Edge Function, where PRIVATE_KEY exists.
  // We keep this method throwing an error on the frontend to prevent accidental key exposure.
  async storeHashOnChain(caseId: string, caseHashHex: string): Promise<string> {
    throw new Error("storeHashOnChain must NOT be called from the frontend. Use the Supabase Edge Function.");
  }

  async getHashFromChain(caseId: string): Promise<string | null> {
    if (!this.contract || !this.isConfigured) return null;
    try {
      const numericId = this.uuidToUint256(caseId);
      const hash = await this.contract.getHash(numericId);
      return hash === ethers.ZeroHash ? null : hash;
    } catch (error) {
      console.error("Error fetching hash from chain:", error);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
