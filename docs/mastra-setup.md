# Mastra AI Brain Setup

## Installation Complete ✅

Mastra has been successfully installed and configured for the Saydo project.

## What's Been Installed

### Dependencies
- `@mastra/core@beta` - Core Mastra framework
- `@mastra/memory@beta` - Memory management
- `@mastra/libsql@beta` - LibSQL storage provider

### Project Structure
```
src/mastra/
├── index.ts          # Main Mastra configuration
├── agents/
│   ├── test-agent.ts # Test agent (for verification)
│   └── .gitkeep
├── tools/
│   └── .gitkeep
└── workflows/
    └── .gitkeep
```

## Environment Variables

Add to your `.env.local` file:

```env
# Required for Mastra
OPENAI_API_KEY=your_openai_api_key_here

# Optional - for production (Vercel)
# Use external storage instead of file-based LibSQL
# MASTRA_STORAGE_URL=libsql://your-turso-url
```

## Running Mastra Studio

Start the Mastra development server and Studio UI:

```bash
npm run mastra
# or
npx mastra dev
```

Studio will be available at: `http://localhost:4111`

## Next Steps

1. **Set OpenAI API Key**: Add `OPENAI_API_KEY` to `.env.local`
2. **Test Setup**: Run `npm run mastra` to start Mastra Studio
3. **Create Agents**: Start building your agents in `src/mastra/agents/`
4. **Create Tools**: Add tools in `src/mastra/tools/`
5. **Create Workflows**: Build workflows in `src/mastra/workflows/`

## Vercel Deployment Notes

- **Do NOT use file-based LibSQL** on Vercel (serverless)
- Use in-memory storage for development (`:memory:`)
- For production, use external storage:
  - Turso (LibSQL cloud)
  - Supabase Postgres
  - Other supported providers

## Current Status

- ✅ Mastra dependencies installed
- ✅ Basic configuration created
- ✅ Test agent created
- ✅ Package.json scripts added
- ⏳ OpenAI API key needed
- ⏳ Agents, tools, workflows to be created



