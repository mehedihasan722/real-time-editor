"use client";
import { useRef, useState, type InputHTMLAttributes } from "react";
import { FolderUp, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readAssistFiles, type AssistAttachment } from "@/lib/assist-attachments";

export function AssistUpload({ attachments, onChange, disabled, onReading }: { attachments: AssistAttachment[]; onChange: (files: AssistAttachment[]) => void; disabled: boolean; onReading?: (value: boolean) => void }) {
  const fileInput = useRef<HTMLInputElement>(null); const folderInput = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false); const [warnings, setWarnings] = useState<string[]>([]);
  const directory = { webkitdirectory: "", directory: "" } as InputHTMLAttributes<HTMLInputElement>;
  const select = async (input: HTMLInputElement) => {
    const files = Array.from(input.files || []); input.value = "";
    setReading(true); onReading?.(true); setWarnings([]);
    try { const result = await readAssistFiles(files, attachments); onChange(result.attachments); setWarnings(result.warnings); }
    catch { setWarnings(["Could not read the selected files. Try again."]); }
    finally { setReading(false); onReading?.(false); }
  };
  return <div className="my-2 space-y-2"><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" disabled={disabled || reading} onClick={() => fileInput.current?.click()}><Paperclip className="mr-2 size-4" />Upload files</Button><Button type="button" variant="outline" size="sm" disabled={disabled || reading} onClick={() => folderInput.current?.click()}><FolderUp className="mr-2 size-4" />Upload folder</Button>{reading && <span role="status">Reading files…</span>}</div><input ref={fileInput} aria-label="Choose files for Assist" type="file" multiple hidden onChange={event => void select(event.currentTarget)} /><input ref={folderInput} aria-label="Choose folder for Assist" type="file" multiple hidden {...directory} onChange={event => void select(event.currentTarget)} />{attachments.length > 0 && <ul aria-label="Attached files" className="max-h-32 space-y-1 overflow-auto">{attachments.map(file => <li key={file.name} className="flex items-center gap-2 rounded border bg-muted/20 p-2 text-xs"><Paperclip className="size-3 shrink-0" /><span className="min-w-0 flex-1 break-all">{file.name} · {file.kind}</span><button type="button" disabled={disabled || reading} aria-label={`Remove ${file.name}`} onClick={() => onChange(attachments.filter(item => item.name !== file.name))}><X className="size-4" /></button></li>)}</ul>}<p className="text-xs text-muted-foreground">Up to 20 files. Attachments are shared with your AI provider only when you send.</p>{warnings.length > 0 && <div role="alert" className="max-h-24 overflow-auto text-xs text-amber-700 dark:text-amber-300">{warnings.slice(0, 20).map((warning, index) => <p key={index}>{warning}</p>)}{warnings.length > 20 && <p>{warnings.length - 20} additional files skipped.</p>}</div>}</div>;
}
