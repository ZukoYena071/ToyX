import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import UploadOverlay from "@/components/upload-overlay";

interface UploadContextType {
  openUpload: (options?: { toy?: any; restoreDraft?: any }) => void;
  closeUpload: () => void;
  isOpen: boolean;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; toy?: any; restoreDraft?: any }>({ open: false });

  const openUpload = useCallback((options?: { toy?: any; restoreDraft?: any }) => {
    setState({ open: true, toy: options?.toy, restoreDraft: options?.restoreDraft });
  }, []);

  const closeUpload = useCallback(() => {
    setState({ open: false });
  }, []);

  return (
    <UploadContext.Provider value={{ openUpload, closeUpload, isOpen: state.open }}>
      {children}
      {state.open && (
        <UploadOverlay
          onClose={closeUpload}
          toy={state.toy}
          restoreDraft={state.restoreDraft}
        />
      )}
    </UploadContext.Provider>
  );
}

export function useUpload(): UploadContextType {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}
