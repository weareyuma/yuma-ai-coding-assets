This package lets agents create Yuma-branded videos — promos, product launches, trailers, explainers, announcements — with animation, voice-over and music.

It is a Yuma layer on top of [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache-2.0), which provides the HTML-to-video engine, rendering, audio mixing, checks and preview. The `motion-video` skill adds the Yuma frame spec (`frame.md`), storytelling guidance (SCQA, audiences, the Yuma voice) and the voice-over rules, with a small script that generates narration clips and word timings.

It depends on `yuma-design-system` for the brand, and on the HyperFrames skills, which are installed separately:

```bash
npx hyperframes skills update     # Node 22+ and FFmpeg required
```

The voice-over script uses an ElevenLabs API key (`ELEVENLABS_API_KEY`); word timings use an OpenAI key (`OPENAI_API_KEY`).
