# E.V.E. Environment Setup

This document explains how to set up the environment variables for the E.V.E. (Elevated Virtual Essence) project.

## Required Environment Variables

The following environment variables need to be set in your `.env.local` file:

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### OpenRouter Configuration
- `OPENROUTER_API_KEY` - Your OpenRouter API key (get one from https://openrouter.ai/keys)

### OpenAI Configuration
- `OPENAI_API_KEY` - Your OpenAI API key (required for embeddings as OpenRouter doesn't support them)

### Optional Environment Variables
- `NEXT_PUBLIC_SITE_URL` - The URL of your site (for OpenRouter analytics)
- `NEXT_PUBLIC_SITE_NAME` - The name of your site (for OpenRouter analytics)

## Setting Up OpenRouter

1. Visit [OpenRouter](https://openrouter.ai/) and create an account.
2. Go to [API Keys](https://openrouter.ai/keys) to generate a new API key.
3. Copy your API key and paste it in the `.env.local` file.

Example `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Optional site URL and name for OpenRouter analytics
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=E.V.E. Assistant
```

## OpenRouter Models

E.V.E. is configured to use OpenRouter models for its AI capabilities. Currently, it uses:

- **Chat completions**: `openrouter/quasar-alpha` 
- **Embeddings**: `openai/text-embedding-3-small`

You can change these models in:
- Chat model: `eve-app/src/app/api/chat/route.ts`
- Embedding model: `eve-app/src/lib/ai/utils.ts`

Available models can be found in the [OpenRouter documentation](https://openrouter.ai/docs/models).

## Troubleshooting

### API Key Issues
- If you encounter chat completion errors, check your OpenRouter API key
- If you encounter embedding errors, check your OpenAI API key

### Missing or Invalid OpenAI API Key
Since OpenRouter doesn't currently support embeddings directly, E.V.E. uses OpenAI's API for generating embeddings. If you see errors like:
```
Embedding API error (401): {"error":{"message":"Invalid API key"}}
```
Make sure your `OPENAI_API_KEY` is correctly set in the `.env.local` file.

### Development Testing
In development mode, if embeddings fail, E.V.E. will fall back to using random vector embeddings. While this allows testing other functionality, semantic search results won't be meaningful. 