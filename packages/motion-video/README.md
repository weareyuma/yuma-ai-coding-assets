This package lets agents create Yuma-branded motion videos — promos, product launches, explainers, announcements — as an HTML timeline rendered to MP4 (4K, dark and light themes) with a text-to-speech voice-over and a synthesised music track.

It bundles the `motion-video` skill (workflow, storytelling and Yuma voice guidance, a timeline engine reference and a working starter template) and depends on `yuma-design-system` for the brand palette, typography and assets.

Requirements on the machine that renders: Google Chrome, ffmpeg, Node.js and `uv`. The voice-over uses an ElevenLabs API key (`ELEVENLABS_API_KEY`); word-level sync and transcription checks use an OpenAI key (`OPENAI_API_KEY`).
