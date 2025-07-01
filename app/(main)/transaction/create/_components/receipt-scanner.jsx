"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/useFetch";
import { scanReceipt } from "@/actions/transaction";

function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
    error: scanError,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    await scanReceiptFn(file);
  };

  useEffect(() => {
    if (scannedData && !scanReceiptLoading) {
      onScanComplete(scannedData);
    }
    // Only run when scanReceiptLoading or scannedData changes!
  }, [scanReceiptLoading, scannedData]);

  useEffect(() => {
    if (scanError && !scanReceiptLoading) {
      toast.error("Failed to scan receipt", {
        description: scanError.message || "Please try with a clearer image",
      });
    }
  }, [scanError, scanReceiptLoading]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleReceiptScan(file);
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        capture="environment"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-xs sm:text-sm">Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            <span className="text-xs sm:text-sm">Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}

export default ReceiptScanner;