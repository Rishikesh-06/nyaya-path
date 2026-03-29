export const generateCaseHash = async (data: {
  title: string;
  description: string;
  user_id: string;
  created_at: string;
}): Promise<string> => {
  // Normalize data: sort keys, trim whitespace, and stable stringify
  const normalizedData = {
    created_at: data.created_at ? new Date(data.created_at).toISOString() : '',
    description: (data.description || '').trim(),
    title: (data.title || '').trim(),
    user_id: String(data.user_id || '').trim()
  };

  const jsonString = JSON.stringify(normalizedData);
  
  // Generate SHA-256 hash using Web Crypto API
  const encoder = new TextEncoder();
  const dataByte = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataByte);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // ethers.js bytes32 expects a 0x prefix
  return '0x' + hashHex;
};

export const generateDeterministicTxId = async (caseId: string, caseHash: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataByte = encoder.encode(caseId + caseHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataByte);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
};
