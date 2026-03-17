import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "NEXUS AI",
    version: "1.0.0",
    description: "Personal Intelligence System",
    capabilities: [
      { id: "chat", name: "Chat & Reasoning", status: "active" },
      { id: "voice", name: "Voice Assistant", status: "active" },
      { id: "vision", name: "Vision & Camera", status: "active" },
      { id: "image", name: "Image Generation", status: "active" },
      { id: "video", name: "Video Generation", status: "active" },
      { id: "code", name: "Code Assistant", status: "active" },
      { id: "document", name: "Document Creator", status: "active" },
      { id: "search", name: "Web Search", status: "active" }
    ],
    endpoints: {
      chat: "/api/chat",
      transcribe: "/api/transcribe",
      speak: "/api/speak",
      vision: "/api/vision",
      image: "/api/image",
      video: "/api/video",
      document: "/api/document",
      search: "/api/search"
    }
  });
}
