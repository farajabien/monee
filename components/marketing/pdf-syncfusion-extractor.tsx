"use client";

import { useEffect, useRef, useState } from "react";
import { PdfViewerComponent, Inject, Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, ThumbnailView, Print, TextSelection, Annotation, TextSearch } from "@syncfusion/ej2-react-pdfviewer";

type Props = {
  file?: File;
  onTextExtracted: (text: string) => void;
  hidden?: boolean;
};

export default function PdfSyncfusionExtractor({ file, onTextExtracted, hidden }: Props) {
  const viewerRef = useRef<PdfViewerComponent>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadFile = async () => {
      if (!file || !viewerRef.current) return;
      const buffer = await file.arrayBuffer();
      // Load from ArrayBuffer; second arg is password if any
      // @ts-ignore - load exists at runtime
      viewerRef.current?.load(buffer, null);
    };
    loadFile();
  }, [file]);

  const handleDocumentLoad = async () => {
    setLoaded(true);
    try {
      // Access the underlying instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inst: any = (viewerRef.current as any)?.element?.ej2_instances?.[0];
      if (!inst) return;
      const pageCount = inst.pageCount ?? 0;
      if (pageCount === 0) return;
      // Extract text across all pages
      const res = await inst.extractText(0, pageCount - 1, "TextOnly");
      const pageText = res?.pageText ?? "";
      if (pageText && typeof onTextExtracted === "function") {
        onTextExtracted(pageText);
      }
    } catch (e) {
      console.error("Syncfusion text extraction error:", e);
    }
  };

  return (
    <div style={hidden ? { position: "absolute", left: -9999, top: -9999, width: 1, height: 1 } : undefined}>
      <PdfViewerComponent
        id="syncfusion-pdf-extractor"
        ref={viewerRef}
        // Use CDN resources so we don't need extra bundler config
        resourceUrl="https://cdn.syncfusion.com/ej2/31.2.2/dist/ej2-pdfviewer-lib"
        style={{ height: hidden ? 1 : 480 }}
        documentLoad={handleDocumentLoad}
      >
        <Inject services={[Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, ThumbnailView, Print, TextSelection, Annotation, TextSearch]} />
      </PdfViewerComponent>
    </div>
  );
}
