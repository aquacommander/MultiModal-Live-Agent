# ORB Integrated Agent Platform

Integrated hackathon platform with:

- `Live Agent` (ORB realtime voice experience)
- `Creative Storyteller` (multimodal generation module)
- `UI Navigator` placeholder for next phase

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `GEMINI_API_KEY` in `.env.local`
4. (Optional) Set `CLOUD_PERSIST_ENDPOINT` in `.env.local` for cloud artifact uploads
5. Start app: `npm run dev`

## Cloud persistence

When `CLOUD_PERSIST_ENDPOINT` is configured, generated image/video artifacts are uploaded
to your cloud endpoint and surfaced in the artifact panel as cloud links.

Expected endpoint behavior:

- accepts `POST multipart/form-data`
- fields include `file`, `kind`, `prompt`, `timestamp`
- returns JSON like `{ "url": "https://...", "message": "uploaded" }`

A ready-to-deploy Cloud Run service is included at:

- `services/cloud-upload`

## Structure

- `src/modules/live-agent` - ORB Live API module
- `src/modules/creative-storyteller` - multimodal generation module
- `src/orchestration` - workflow/task/artifact coordination
- `src/shell` - integrated UI shell
