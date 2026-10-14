import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api/client';
import type { ScanResult } from '@/types/receipt';

/**
 * Provide receipt scanner state and actions to React consumers.
 *
 * Use it in React components that need use receipt scanner behavior.
 * @returns The current receipt scanner state and the actions that operate on it.
 */
export const useReceiptScanner = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scan = useMutation({
    /**
     * Execute the use receipt scanner mutation requested by the client.
     *
     * Use it in React components that need use receipt scanner behavior.
     * @param selectedFile - The file-system location or file value used by the operation.
     * @returns The resulting use receipt scanner value for the caller.
     */
    mutationFn: (selectedFile: File) => {
      const formData = new FormData();
      formData.append('file', selectedFile);
      return api.post('/ai/receipt/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((response) => response.data.data);
    },
    onSuccess: setResult,
  });

  return {
    file,
    setFile,
    result,
    isScanning: scan.isPending,
    /**
     * Scan for use receipt scanner.
     *
     * Use it in React components that need use receipt scanner behavior.
     * @returns The resulting use receipt scanner value for the caller.
     */
    scan: () => file && scan.mutate(file),
    /**
     * Reset use receipt scanner to the use receipt scanner workflow's initial state.
     *
     * Use it in React components that need use receipt scanner behavior.
     * @returns Nothing; the operation is complete when the function returns.
     */
    reset: () => { setResult(null); setFile(null); },
  };
};
