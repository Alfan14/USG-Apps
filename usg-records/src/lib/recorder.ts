import { ChildProcess } from "child_process";
import { startRetryWorker } from "./retryWorker";

/**
 * Global singleton to store the active FFmpeg recording process state.
 * This persists across API route calls within the same Next.js server process.
 */

export interface RecorderError {
  message: string;
  code?: string | null;
  details?: string | null;
  timestamp: number;
}

interface RecorderState {
  process: ChildProcess | null;
  patientId: string | null;
  draftPatientId: string;
  isStarting: boolean;
  lastError: RecorderError | null;
  recordingId: number | null;
  filename: string | null;
  localPath: string | null;
  startedAt: number | null; // Date.now() timestamp
  isMock: boolean;
}

// Attach to globalThis to survive HMR in dev mode
const g = globalThis as typeof globalThis & { __recorder?: RecorderState };

if (!g.__recorder) {
  g.__recorder = {
    process: null,
    patientId: null,
    draftPatientId: "",
    isStarting: false,
    lastError: null,
    recordingId: null,
    filename: null,
    localPath: null,
    startedAt: null,
    isMock: false,
  };
  
  // Start background retry worker
  startRetryWorker();
}

export const recorder = g.__recorder;

export function isRecording(): boolean {
  return recorder.process !== null && recorder.process.exitCode === null;
}
