import { useState } from "react";
import {
  FileText, Upload, X, Loader2, Hash, Cpu, HardDrive,
  AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Layers, Zap,
  Paperclip, Download, ShieldCheck, Puzzle,
} from "lucide-react";
import type { FileEntry, AnalyzedFile } from "../hooks/useMultiFileAnalyzer";
import { formatSize } from "../hooks/useFileAnalyzer";
import LosslessDecoder from "./LosslessDecoder";
import type { RecoveredFile, DecodeResult } from "../hooks/useLossless";

// ── FileCard ───────────────────────────────────────────────────────────────────
interface FileCardProps {
  entry: FileEntry;
  onRemove: (id: string) => void;
}

function FileCard({ entry, onRemove }: FileCardProps) {
  const [open, setOpen] = useState(false);
  const { file, analysis, id } = entry;
  const { analyzing, language, tokenCount, fileSize, sizeError, fetchError } = analysis;
  const hasError = !!(sizeError || fetchError);
  const errorMsg = sizeError || fetchError;

  return (
    <div className={`fc-card${hasError ? " fc-card--error" : ""}`}>
      <div
        className="fc-header"
        onClick={() => !hasError && setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !hasError && setOpen((v) => !v)}
      >
        <div className="fc-file-icon">
          {analyzing ? (
            <Loader2 size={16} className="fc-spinner" />
          ) : hasError ? (
            <AlertCircle size={16} className="fc-error-icon" />
          ) : (
            <FileText size={16} />
          )}
        </div>
        <span className="fc-name" title={file.name}>{file.name}</span>
        {!hasError && (
          <ChevronDown size={14} className={`fc-chevron${open ? " open" : ""}`} />
        )}
        <button
          className="fc-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          aria-label={`Remove ${file.name}`}
          type="button"
        >
          <X size={12} />
        </button>
      </div>

      {hasError && <div className="fc-error-msg">{errorMsg}</div>}

      {!hasError && (
        <div className={`fc-details${open ? " open" : ""}`}>
          <div className="fc-details-inner">
            <div className="fc-detail-row">
              <HardDrive size={12} className="fc-detail-icon" />
              <span className="fc-detail-label">File size</span>
              <span className="fc-detail-value">{fileSize || formatSize(file.size)}</span>
            </div>
            <div className="fc-detail-row">
              <Cpu size={12} className="fc-detail-icon" />
              <span className="fc-detail-label">Language</span>
              <span className={`fc-detail-value${language === "Detecting..." ? " fc-muted" : ""}`}>
                {language}
              </span>
            </div>
            <div className="fc-detail-row">
              <Hash size={12} className="fc-detail-icon" />
              <span className="fc-detail-label">Est. tokens</span>
              <span className={`fc-detail-value${tokenCount === "Calculating..." ? " fc-muted" : ""}`}>
                {tokenCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab definition ─────────────────────────────────────────────────────────────
type PanelTab = "files" | "export" | "decode";

// ── FilePanel ──────────────────────────────────────────────────────────────────
export interface FilePanelProps {
  entries: FileEntry[];
  resolvedFiles: AnalyzedFile[];
  onRemove: (id: string) => void;
  onCompress: () => void;
  compressing: boolean;
  hasCompressResults: boolean;
  // Export modes
  onExportRaw: () => void;
  onExportCompressed: () => void;
  onExportNoExtension: () => void;
  onExportWithExtension: () => void;
  exportingRaw: boolean;
  exportingCompressed: boolean;
  exportingNoExtension: boolean;
  exportingWithExtension: boolean;
  // Lossless pipeline
  onExportLossless: () => void;
  exportingLossless: boolean;
  losslessDecoding: boolean;
  losslessError: string | null;
  losslessDecodeResult: DecodeResult | null;
  onDecodeLossless: (file: File) => void;
  onDownloadRecovered: (file: RecoveredFile) => void;
  onClearDecode: () => void;
}

export default function FilePanel({
  entries,
  resolvedFiles,
  onRemove,
  onCompress,
  compressing,
  hasCompressResults,
  onExportRaw,
  onExportCompressed,
  onExportNoExtension,
  onExportWithExtension,
  exportingRaw,
  exportingCompressed,
  exportingNoExtension,
  exportingWithExtension,
  onExportLossless,
  exportingLossless,
  losslessDecoding,
  losslessError,
  losslessDecodeResult,
  onDecodeLossless,
  onDownloadRecovered,
  onClearDecode,
}: FilePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("files");

  const totalTokens = resolvedFiles.reduce((sum, f) => sum + f.tokenEstimate, 0);
  const hasResolved = resolvedFiles.length > 0;
  const anyExporting =
    exportingRaw || exportingCompressed ||
    exportingNoExtension || exportingWithExtension ||
    exportingLossless;

  // ── Collapsed strip ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div
        className="fp-collapsed"
        onClick={() => setCollapsed(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setCollapsed(false)}
        title="Expand files panel"
      >
        <ChevronLeft size={14} />
        <Paperclip size={14} className="fp-collapsed-icon" />
        {entries.length > 0 && (
          <span className="fp-collapsed-badge">{entries.length}</span>
        )}
        <span className="fp-collapsed-label">Files</span>
      </div>
    );
  }

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const tabs: { id: PanelTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: "files",
      label: "Files",
      icon: <Paperclip size={13} />,
      badge: entries.length > 0 ? entries.length : undefined,
    },
    {
      id: "export",
      label: "Export",
      icon: <Download size={13} />,
    },
    {
      id: "decode",
      label: "Decode",
      icon: <ShieldCheck size={13} />,
      badge: losslessDecodeResult ? "✓" : undefined,
    },
  ];

  return (
    <aside className="file-panel">
      {/* Header */}
      <div className="fp-header">
        <span className="fp-header-title">TokenTrim</span>
        <button
          className="fp-collapse-btn"
          onClick={() => setCollapsed(true)}
          title="Collapse panel"
          type="button"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="fp-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`fp-tab${activeTab === tab.id ? " fp-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`fp-tab-badge${tab.badge === "✓" ? " fp-tab-badge--ok" : ""}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FILES TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "files" && (
        <>
          <div className="fp-body">
            {entries.length === 0 ? (
              <div className="fp-empty">
                <div className="fp-empty-icon">
                  <Upload size={30} strokeWidth={1.5} />
                </div>
                <p className="fp-empty-title">No files attached yet</p>
                <p className="fp-empty-sub">
                  Click the paperclip icon in the prompt bar to attach code files.
                  Each file is analysed individually.
                </p>
              </div>
            ) : (
              <div className="fp-file-list">
                {entries.map((entry) => (
                  <FileCard key={entry.id} entry={entry} onRemove={onRemove} />
                ))}
              </div>
            )}
          </div>

          {hasResolved && (
            <div className="fp-summary">
              <div className="fp-summary-row">
                <span className="fp-summary-label">
                  <Layers size={13} /> Total files
                </span>
                <span className="fp-summary-value">{resolvedFiles.length}</span>
              </div>
              <div className="fp-summary-row fp-summary-tokens">
                <span className="fp-summary-label fp-summary-label--accent">
                  <Hash size={13} /> Total Context Tokens
                </span>
                <span className="fp-summary-accent">{totalTokens.toLocaleString()}</span>
              </div>
              <button
                className={`fp-compress-btn${compressing ? " fp-compress-btn--loading" : ""}${hasCompressResults ? " fp-compress-btn--done" : ""}`}
                onClick={onCompress}
                disabled={compressing}
                type="button"
              >
                {compressing ? (
                  <><Loader2 size={15} className="fc-spinner" /> Compressing…</>
                ) : hasCompressResults ? (
                  <><Zap size={15} /> Re-Compress</>
                ) : (
                  <><Zap size={15} /> Compress Files</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── EXPORT TAB ────────────────────────────────────────────────────── */}
      {activeTab === "export" && (
        <div className="fp-tab-pane">
          {!hasResolved ? (
            <div className="fp-empty fp-empty--tab">
              <div className="fp-empty-icon">
                <Download size={28} strokeWidth={1.5} />
              </div>
              <p className="fp-empty-title">No files ready</p>
              <p className="fp-empty-sub">Attach and analyse files first, then export a bundle.</p>
            </div>
          ) : (
            <>
              <p className="fp-tab-desc">
                Choose how the receiving LLM should handle your compressed context.
              </p>

              {/* ── Mode card: No Extension ─────────────────────────── */}
              <div className="fp-mode-card fp-mode-card--no-ext">
                <div className="fp-mode-card-header">
                  <div className="fp-mode-card-icon">
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="fp-mode-card-title">No Extension</div>
                    <div className="fp-mode-card-sub">LLM self-decodes</div>
                  </div>
                </div>
                <p className="fp-mode-card-desc">
                  Bundles compressed text with a full decode guide so <em>any</em> LLM
                  can expand it on its own — no plugin needed.
                </p>
                <button
                  className="fp-pipeline-btn fp-pipeline-btn--no-ext"
                  onClick={onExportNoExtension}
                  disabled={anyExporting}
                  type="button"
                >
                  {exportingNoExtension ? (
                    <><Loader2 size={14} className="fc-spinner" /> Building…</>
                  ) : (
                    <><Download size={14} /> Export Bundle (.txt)</>
                  )}
                </button>
              </div>

              {/* ── Mode card: With Extension ───────────────────────── */}
              <div className="fp-mode-card fp-mode-card--with-ext">
                <div className="fp-mode-card-header">
                  <div className="fp-mode-card-icon">
                    <Puzzle size={18} />
                  </div>
                  <div>
                    <div className="fp-mode-card-title">With Extension</div>
                    <div className="fp-mode-card-sub">Silent auto-decode</div>
                  </div>
                </div>
                <p className="fp-mode-card-desc">
                  Lossless payload wrapped in a sentinel — the TokenTrim extension
                  decodes it silently before the LLM ever sees it. Zero overhead tokens.
                </p>
                <button
                  className="fp-pipeline-btn fp-pipeline-btn--with-ext"
                  onClick={onExportWithExtension}
                  disabled={anyExporting}
                  type="button"
                >
                  {exportingWithExtension ? (
                    <><Loader2 size={14} className="fc-spinner" /> Encoding…</>
                  ) : (
                    <><Download size={14} /> Export Bundle (.txt)</>
                  )}
                </button>
              </div>

              {/* ── Fallback: raw + legacy compressed ──────────────── */}
              <div className="fp-export-group fp-export-group--minor">
                <div className="fp-export-group-label">Other formats</div>
                <button
                  className="fp-pipeline-btn fp-pipeline-btn--raw"
                  onClick={onExportRaw}
                  disabled={anyExporting}
                  type="button"
                  title="Plain-text bundle — no compression"
                >
                  {exportingRaw ? (
                    <><Loader2 size={14} className="fc-spinner" /> Building…</>
                  ) : (
                    <><Download size={14} /> Raw Bundle (.txt)</>
                  )}
                </button>
                <button
                  className="fp-pipeline-btn fp-pipeline-btn--lossless"
                  onClick={onExportLossless}
                  disabled={anyExporting}
                  type="button"
                  title="100% lossless JSON archive — decode back to originals"
                >
                  {exportingLossless ? (
                    <><Loader2 size={14} className="fc-spinner" /> Encoding…</>
                  ) : (
                    <><ShieldCheck size={14} /> Lossless Archive (.json)</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DECODE TAB ────────────────────────────────────────────────────── */}
      {activeTab === "decode" && (
        <div className="fp-tab-pane">
          <p className="fp-tab-desc">
            Upload a <strong>Lossless Bundle (.json)</strong> to recover all original files — byte-perfect, zero data loss.
          </p>
          <LosslessDecoder
            running={losslessDecoding ? "decoding" : null}
            error={losslessError}
            decodeResult={losslessDecodeResult}
            onDecode={onDecodeLossless}
            onDownloadFile={onDownloadRecovered}
            onClear={onClearDecode}
          />
        </div>
      )}
    </aside>
  );
}
