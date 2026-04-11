"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  pdfPath: string;
  title: string;
}

export function PdfViewer({ open, onClose, pdfPath, title }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[95vw] w-full h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <iframe
          src={pdfPath}
          className="w-full flex-1 border-0"
          style={{ height: "calc(90vh - 70px)" }}
          title={title}
        />
      </DialogContent>
    </Dialog>
  );
}
