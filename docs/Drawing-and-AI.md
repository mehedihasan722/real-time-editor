# Drawing, AI providers, and flowchart layouts

Pen, marker, magic pen, and erasers capture the active pointer. Releasing outside the canvas finishes the stroke; cancellation clears its draft and resumes undo history. Long strokes are progressively sampled instead of stopping at a point limit. Touch drawing disables browser gestures on the drawing surface. Only the active pointer can extend a stroke or erase.

Magic pen recognizes supported closed shapes and straight lines. Trace an overlapping similar rough path with magic pen to replace that path in place, preserving its layer ID and order. Uncertain sketches remain freehand. The board object limit is reported rather than failing silently.

Flowchart insertion opens an accessible modal with Delivery & approvals, Linear, Decision, Swimlane, and Custom layouts. Custom layouts accept up to twenty nonempty steps. Preview and insertion use the same layer generator.

The AI provider selector supports Hermes, Gemini, Grok, DeepSeek, and a custom OpenAI-compatible endpoint. Server credentials are GEMINI_API_KEY, XAI_API_KEY, and DEEPSEEK_API_KEY; optional model overrides are documented in .env.example. Existing Hermes and custom endpoint settings remain supported. Automatic mode uses the existing service for the requested mode, then an available external provider. Credentials never reach client capability responses. Each request checks organization and board access and reserves the existing AI rate limit.

Nano Banana image generation uses Gemini's native generateContent endpoint and GEMINI_IMAGE_MODEL (default gemini-2.5-flash-image). Choose Nano Banana image in Playground to preview and download an image. Image responses are bounded to fourteen megabytes and validated for raster MIME types. This does not automatically persist an image to collaborative storage. Requests support cancellation and a fifty-second upstream timeout. Configure the keys in the deployment environment before live generation; no provider account or API key is created by this change.


## File and folder attachments

Upload files or choose a folder in both Assist and Playground. Text/code/CSV/JSON documents and PNG/JPEG/WebP images are previewed with removable entries. Folder paths remain relative. Credentials, .env files, dependency folders, and local tool state are skipped. Unsupported PDF/Office/archive formats are reported; this version does not silently extract or truncate them.

Attachments remain in browser memory until Send. Their contents are then sent to the selected AI provider with the submitted prompt and are not permanently stored. Twenty attachments are allowed, text files are limited to 32,000 characters each / 64,000 total, image files to 1 MB each, and all attachment content to 3 MB. Choose a vision-capable model for image input; Hermes accepts text attachments. Nano Banana accepts images as references. Files are resent on subsequent messages until removed.

AI connections & setup provides provider key links and a Refresh connections button. Local Hermes/Ollama checks use their model-list endpoints with a three-second timeout. Missing credentials and unreachable services are distinguished. A deployed app still requires separately hosted authenticated HTTPS inference or configured external provider keys; Docker on your PC cannot serve Vercel through localhost.
