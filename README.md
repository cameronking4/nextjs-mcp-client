<a href="https://mcp.scira.ai">
  <h1 align="center">Open MCP Workbench</h1>
  <h3 align="center">Inspired by Scira MCP Chat</h1>
</a>

<p align="center">
  A Workbench to test, host, export and embed Model Context Protocol (MCP) web clients, built with Next.js and the AI SDK by Vercel.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> •
  <a href="#mcp-server-configuration"><strong>MCP Configuration</strong></a> •
  <a href="#license"><strong>License</strong></a>
</p>
<br/>

## Features

- Streaming text responses powered by the [AI SDK by Vercel](https://sdk.vercel.ai/docs), allowing multiple AI providers to be used interchangeably with just a few lines of code.
- Full integration with [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers to expand available tools and capabilities.
- Supports MCP transport types (SSE and HTTP Streamable) for connecting to various tool providers.
- Built-in tool integration for extending AI capabilities.
- Reasoning model support.
- [shadcn/ui](https://ui.shadcn.com/) components for a modern, responsive UI powered by [Tailwind CSS](https://tailwindcss.com).
- Built with the latest [Next.js](https://nextjs.org) App Router.
- Support for rendering [Mermaid](https://mermaid.js.org/) diagrams directly in chat messages. See [Mermaid Diagrams documentation](docs/mermaid-diagrams.md) for details.
- Chat & configure agents by combining tools and models:
  - Export as Website Widget for your website. (remote configuration)
  - Export as Expo App for your mobile devices. (remote configuration)
  - Export to v0 to extend as an Agent application. (remote configuration)
  - Export as Full Screen Chat link (remote configuration)
  - Export as HTTP Endpoint. (remote configuration)

## MCP Server Configuration

This application supports connecting to Model Context Protocol (MCP) servers to access their tools. You can add and manage MCP servers through the settings icon in the chat interface.

### Adding an MCP Server

1. Click the settings icon (⚙️) next to the model selector in the chat interface.
2. Enter a name for your MCP server.
3. Select the transport type:
   - **SSE (Server-Sent Events)**: For HTTP-based remote servers using Server-Sent Events
   - **HTTP Streamable**: For HTTP-based remote servers using streamable HTTP

#### Server Configuration

1. Enter the server URL (e.g., `https://mcp.example.com/endpoint`)
2. Add any required HTTP headers (optional)
3. Click "Add Server"
4. Click "Enable Server" to activate the server for the current chat session.

### Available MCP Servers

You can use any MCP-compatible server with this application. Here are some examples:

- [Composio](https://composio.dev/mcp) - Provides search, code interpreter, and other tools
- [Zapier MCP](https://zapier.com/mcp) - Provides access to Zapier tools
- Any MCP-compatible server supporting SSE or HTTP Streamable transport

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
