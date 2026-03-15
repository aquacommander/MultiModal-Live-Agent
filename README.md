# ORB Integrated Agent Platform

Integrated hackathon platform with:

- `Live Agent` (ORB realtime voice experience)
- `Creative Storyteller` (multimodal generation module)
- `UI Navigator` placeholder for next phase

## Run locally

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Start app: `npm run dev`

## Structure

- `src/modules/live-agent` - ORB Live API module
- `src/modules/creative-storyteller` - multimodal generation module
- `src/orchestration` - workflow/task/artifact coordination
- `src/shell` - integrated UI shell
