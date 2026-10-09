import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/components/ui';
import { FileUp, UploadCloud, CheckCircle2 } from 'lucide-react';

export interface PdfImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  isImporting: boolean;
}

export const PdfImportDialog: React.FC<PdfImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
  isImporting,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;
    await onImport(selectedFile);
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={true} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-pastel-green border-2 border-black flex items-center justify-center shadow-neo-sm">
              <FileUp className="w-4 h-4 stroke-[2.5] text-black" />
            </div>
            <DialogTitle>Importar Histórico Escolar (PDF)</DialogTitle>
          </div>
          <DialogDescription>
            Selecione ou arraste o PDF oficial do seu Histórico Escolar emitido pelo SIGAA da UnB.
          </DialogDescription>
        </DialogHeader>

        {/* Zona de Drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all duration-150 flex flex-col items-center justify-center my-4 ${
            dragOver
              ? 'border-neo-blue bg-pastel-blue scale-[1.01]'
              : 'border-black bg-neutral-50 hover:bg-neutral-100'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2 text-black">
              <CheckCircle2 className="w-10 h-10 text-ink-success" />
              <p className="text-xs font-black truncate max-w-[260px]">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-neutral-500 font-bold">
                {(selectedFile.size / 1024).toFixed(1)} KB • Clique para trocar
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-600">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-neo-sm">
                <UploadCloud className="w-6 h-6 stroke-[2] text-black" />
              </div>
              <p className="text-xs font-extrabold text-black mt-1">
                Arraste o arquivo PDF aqui ou clique para selecionar
              </p>
              <p className="text-[11px] font-bold text-neutral-500">
                Documentos oficiais emitidos em SIGAA &gt; Ensino &gt; Emitir Histórico
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancelar
          </Button>

          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!selectedFile || isImporting}
          >
            {isImporting ? 'Processando PDF...' : 'Processar Histórico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
