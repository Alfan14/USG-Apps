import { NextResponse } from "next/server";
import { recorder } from "@/lib/recorder";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      draftPatientId: recorder.draftPatientId || "",
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const newId = typeof body.patientId === "string" ? body.patientId.slice(0, 20) : "";
    recorder.draftPatientId = newId;

    return NextResponse.json(
      {
        success: true,
        draftPatientId: recorder.draftPatientId,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
