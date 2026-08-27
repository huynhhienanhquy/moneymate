import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api/client';
import type { ScanResult } from '@/types/receipt';

export const useReceiptScanner = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scan = useMutation({
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
    scan: () => file && scan.mutate(file),
    reset: () => { setResult(null); setFile(null); },
  };
};
