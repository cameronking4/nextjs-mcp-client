import { db } from "@/lib/db";
import { widgets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/widgets/[id] - Get a specific widget
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from the URL path instead of directly accessing params.id
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const widgetId = pathParts[pathParts.length - 1]; // Get the last part of the path
    
    const userId = req.headers.get('x-user-id');
    const isEmbedded = url.searchParams.get('embedded') === 'true';

    // For embedded widgets, we don't require user authentication
    if (!isEmbedded && !userId) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let widget;
    
    if (isEmbedded) {
      // For embedded widgets, we only check if the widget exists and is public
      widget = await db.query.widgets.findFirst({
        where: eq(widgets.id, widgetId),
      });
      
      if (!widget) {
        return new Response(
          JSON.stringify({ error: "Widget not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      if (!widget.isPublic) {
        // Check if the current domain is in the allowed domains
        const referer = req.headers.get('referer');
        if (!referer) {
          return new Response(
            JSON.stringify({ error: "Access denied" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        
        const refererDomain = new URL(referer).hostname;
        const allowedDomains = widget.allowedDomains as string[];
        
        if (!allowedDomains.includes(refererDomain) && !allowedDomains.includes('*')) {
          return new Response(
            JSON.stringify({ error: "This widget cannot be embedded on this domain" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    } else {
      // For non-embedded widgets, we check if the widget belongs to the user
      widget = await db.query.widgets.findFirst({
        where: and(
          eq(widgets.id, widgetId),
          eq(widgets.userId, userId!)
        ),
      });
      
      if (!widget) {
        return new Response(
          JSON.stringify({ error: "Widget not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Generate embed code
    const embedCode = `<iframe 
  src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget/${widgetId}" 
  width="400" 
  height="600" 
  style="border:none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);" 
  allow="microphone"
></iframe>`;

    return new Response(
      JSON.stringify({
        ...widget,
        embedCode: isEmbedded ? undefined : embedCode,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching widget:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch widget" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT /api/widgets/[id] - Update a widget
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from the URL path instead of directly accessing params.id
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const widgetId = pathParts[pathParts.length - 1]; // Get the last part of the path
    
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if widget exists and belongs to the user
    const existingWidget = await db.query.widgets.findFirst({
      where: and(
        eq(widgets.id, widgetId),
        eq(widgets.userId, userId)
      ),
    });

    if (!existingWidget) {
      return new Response(
        JSON.stringify({ error: "Widget not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
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

    // Update the widget
    const updatedWidget = {
      name: name !== undefined ? name : existingWidget.name,
      modelId: modelId !== undefined ? modelId : existingWidget.modelId,
      mcpServers: mcpServers !== undefined ? mcpServers : existingWidget.mcpServers,
      customization: customization !== undefined ? customization : existingWidget.customization,
      isPublic: isPublic !== undefined ? isPublic : existingWidget.isPublic,
      allowedDomains: allowedDomains !== undefined ? allowedDomains : existingWidget.allowedDomains,
      updatedAt: new Date(),
    };

    await db
      .update(widgets)
      .set(updatedWidget)
      .where(and(
        eq(widgets.id, widgetId),
        eq(widgets.userId, userId)
      ));

    // Generate embed code
    const embedCode = `<iframe 
  src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget/${widgetId}" 
  width="400" 
  height="600" 
  style="border:none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);" 
  allow="microphone"
></iframe>`;

    return new Response(
      JSON.stringify({
        id: widgetId,
        userId,
        ...updatedWidget,
        embedCode,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating widget:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update widget" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE /api/widgets/[id] - Delete a widget
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from the URL path instead of directly accessing params.id
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const widgetId = pathParts[pathParts.length - 1]; // Get the last part of the path
    
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if widget exists and belongs to the user
    const existingWidget = await db.query.widgets.findFirst({
      where: and(
        eq(widgets.id, widgetId),
        eq(widgets.userId, userId)
      ),
    });

    if (!existingWidget) {
      return new Response(
        JSON.stringify({ error: "Widget not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete the widget
    await db
      .delete(widgets)
      .where(and(
        eq(widgets.id, widgetId),
        eq(widgets.userId, userId)
      ));

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting widget:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete widget" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
