import { db } from "@/lib/db";
import { widgets } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/widgets - Get all widgets for a user
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userWidgets = await db.query.widgets.findMany({
      where: eq(widgets.userId, userId),
      orderBy: [widgets.createdAt],
    });

    return new Response(
      JSON.stringify(userWidgets),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching widgets:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch widgets" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/widgets - Create a new widget
export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      name,
      modelId,
      mcpServers,
      customization,
      isPublic,
      allowedDomains,
    } = await req.json();

    if (!modelId) {
      return new Response(
        JSON.stringify({ error: "Model ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!mcpServers || !Array.isArray(mcpServers)) {
      return new Response(
        JSON.stringify({ error: "MCP servers configuration is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const id = nanoid();
    const now = new Date();

    const newWidget = {
      id,
      userId,
      name: name || "My Chat Widget",
      modelId,
      mcpServers,
      customization: customization || {},
      isPublic: isPublic !== undefined ? isPublic : true,
      allowedDomains: allowedDomains || [],
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(widgets).values(newWidget);

    // Generate embed code
    const embedCode = `<iframe 
  src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget/${id}" 
  width="400" 
  height="600" 
  style="border:none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);" 
  allow="microphone"
></iframe>`;

    return new Response(
      JSON.stringify({
        ...newWidget,
        embedCode,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating widget:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create widget" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
