"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { uploadFile } from "@/lib/api";

interface FileUploadZoneProps {
  onUploadComplete?: (articleId: string) => void;
}

export default function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [".txt", ".md", ".markdown"];

  const validateFile = useCallback((file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      return "不支持的文件类型。请上传 .txt 或 .md 文件。";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "文件过大，请上传 10MB 以内的文件。";
    }
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setResult({ type: "error", message: error });
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const res = await uploadFile(file);
      setResult({
        type: "success",
        message: `"${res.filename}" 上传成功（${res.word_count} 字）`,
      });
      onUploadComplete?.(res.article_id);
    } catch (err: any) {
      setResult({
        type: "error",
        message: err.message ?? "上传失败，请稍后重试",
      });
    } finally {
      setUploading(false);
    }
  }, [validateFile, onUploadComplete]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-primary bg-primary/5"
            : uploading
              ? "border-blue-300 bg-blue-50/30 cursor-wait"
              : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.markdown"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-muted-foreground">正在上传...</p>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-medium text-muted-foreground">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              支持 .txt, .md 格式（单文件最大 10MB）
            </p>
          </div>
        )}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            result.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span className="flex-1">{result.message}</span>
          <button
            onClick={() => setResult(null)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success action hint */}
      {result?.type === "success" && (
        <p className="text-xs text-muted-foreground/60 pl-1">
          ✅ 上传的文章现在可以在"选择内容"步骤中选用于视频生成
        </p>
      )}
    </div>
  );
}
