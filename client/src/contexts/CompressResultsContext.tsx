import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { FileCompressionEntry } from "../hooks/useCompressor";
import type { Message } from "../components/ChatArea";
import type { FileEntry } from "../hooks/useMultiFileAnalyzer";

interface CompressResultsContextValue {
  resultsData: FileCompressionEntry[];
  messages: Message[];
  fileEntries: FileEntry[];
  setResultsData: (entries: FileCompressionEntry[]) => void;
  setExportContext: (messages: Message[], fileEntries: FileEntry[]) => void;
  clearResultsData: () => void;
}

const CompressResultsContext = createContext<CompressResultsContextValue | null>(null);

export function CompressResultsProvider({ children }: { children: ReactNode }) {
  const [resultsData, setResultsDataRaw] = useState<FileCompressionEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);

  const setResultsData = useCallback((entries: FileCompressionEntry[]) => {
    setResultsDataRaw(entries);
  }, []);

  const setExportContext = useCallback((msgs: Message[], entries: FileEntry[]) => {
    setMessages(msgs);
    setFileEntries(entries);
  }, []);

  const clearResultsData = useCallback(() => {
    setResultsDataRaw([]);
    setMessages([]);
    setFileEntries([]);
  }, []);

  return (
    <CompressResultsContext.Provider value={{ resultsData, messages, fileEntries, setResultsData, setExportContext, clearResultsData }}>
      {children}
    </CompressResultsContext.Provider>
  );
}

export function useCompressResults() {
  const ctx = useContext(CompressResultsContext);
  if (!ctx) throw new Error("useCompressResults must be used inside CompressResultsProvider");
  return ctx;
}
