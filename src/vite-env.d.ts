/// <reference types="vite/client" />

// Type definitions for Web NFC API
// Based on https://w3c.github.io/web-nfc/

interface NDEFRecordDataSource {
  // Can be a string, BufferSource, or another NDEFMessageInit.
}

interface NDEFRecordInit {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: NDEFRecordDataSource;
  encoding?: string;
  lang?: string;
}

interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

interface NDEFWriteOptions {
  overwrite?: boolean;
  signal?: AbortSignal;
}

declare class NDEFReader {
  constructor();
  write(message: NDEFMessageInit, options?: NDEFWriteOptions): Promise<void>;
  scan(options?: { signal: AbortSignal }): Promise<void>;
  onreading: (event: any) => void;
  onreadingerror: (event: any) => void;
}

interface Window {
  NDEFReader: typeof NDEFReader;
}