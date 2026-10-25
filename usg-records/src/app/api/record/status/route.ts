import { NextResponse } from "next/server";
import { recorder, isRecording } from "@/lib/recorder";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  const active = isRecording();
  const durationSeconds =
    active && recorder.startedAt
      ? Math.floor((Date.now() - recorder.startedAt) / 1000)
      : 0;

  const state = active ? "recording" : recorder.isStarting ? "starting" : "ready";

  return NextResponse.json(
    {
      state,
      patientId: active ? (recorder.patientId || "") : (recorder.draftPatientId || ""),
      draftPatientId: recorder.draftPatientId || "",
      isRecording: active,
      isStarting: recorder.isStarting,
      lastError: recorder.lastError,
      startedAt: recorder.startedAt || null,
      durationSeconds,
    },
    {
      headers: CORS_HEADERS,
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
