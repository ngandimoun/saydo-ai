# Landing Page Image Generation

## Setup

Make sure you have these environment variables in your `.env.local` file:

```env
REPLICATE_API_TOKEN=your_token_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting the Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` is required for the image generation script to bypass RLS policies:

1. Go to your **Supabase Dashboard**
2. Navigate to **Settings** > **API**
3. Find the **service_role** key (marked as "secret")
4. Copy it and add to `.env.local`

**Important**: The service role key bypasses all RLS policies. Keep it secret and never expose it to client-side code. It's safe to use in server-side scripts like this one.

See [docs/supabase-storage-setup.md](docs/supabase-storage-setup.md) for more details.

## Generate Images

Run the image generation script:

```bash
npm run generate-images
```

This will:
1. Generate 9 images using Replicate (nano-banana-pro model)
2. Upload them to Supabase Storage in the `generated-images` bucket
3. Save the URLs to `lib/landing-images.json`

## Images Generated

The script generates the following images emphasizing **AI Agent Workflow** (not just transcription):

1. **before-after-comparison** - Side-by-side showing messy transcript vs AI agent output
2. **how-it-works-visual** - Infographic of the AI agent workflow process
3. **ai-agent-workflow** - Visual representation of the AI agent actively working
4. **agent-vs-transcription** - Comparison showing transcription vs intelligent agent
5. **use-case-healthcare** - Healthcare worker with AI agent workflow
6. **use-case-founder** - Business professional with AI agent organizing thoughts
7. **use-case-caregiver** - Caregiver with AI agent structuring care logs
8. **use-case-writer** - Writer with AI agent organizing creative notes
9. **use-case-technician** - Technician with AI agent creating service reports

## Using Images in Components

Images are automatically loaded in components via `getLandingImageUrl()`:

```typescript
import { getLandingImageUrl } from "@/lib/landing-images"

// In your component
<Image
  src={getLandingImageUrl("ai-agent-workflow")}
  alt="AI Agent Workflow"
  fill
  className="object-cover"
/>
```

## Image Storage

All images are stored in Supabase Storage:
- Bucket: `generated-images`
- Folder structure: `landing/` and `landing/use-cases/`

The components will automatically use the generated URLs once the script completes.

