# E-003 — STT via Ollama `/api/chat` with `images:[base64 WAV]`; whisper.cpp as future fallback

- **Status:** accepted (P0 — design only; implementation in Phase 3)
- **Date:** 2026-05-22
- **Issue:** none
- **Decided by:** Inoyatov Khamidulla

## Context

The original Earshot spec called for transcription via Ollama's
`POST /v1/audio/transcriptions` endpoint. Research at planning time (PLAN.md
§ "Research findings that adjust the spec") confirmed that endpoint **does
not exist** in any Ollama release as of 2026-05.

The spec also named `gemma4:e4b` as the STT model. Gemma 4 (released
2026-04-02 by Google DeepMind) **is** a multimodal model with audio input as
a documented capability. Ollama's OpenAI-compat layer documents
`image_url` only; no `audio_url` content type. However, community
investigation (Ollama GitHub issues #15427, #15333, #15807, PR #15243)
established that Ollama's native `/api/chat` endpoint accepts WAV bytes via
the existing `images: [base64WAV]` array — a backward-compat side-effect
that PR #15243 will eventually formalize as `audios: []`.

Constraints observed:

- WAV must be RIFF, 16 kHz mono PCM16, ≤30–60 s per request.
- Audio bytes must precede text in the user message.
- Recommend `options.num_ctx = 8192` to avoid KV-cache overflow.
- Single-shot only; no streaming for audio yet.

Ultraplan (Round-15, PLAN.md § R15.4) also recommended restoring
**whisper.cpp** as an automatic fallback because:

1. Diarization alignment in Phase 9 needs word-level timestamps —
   re-slicing system.wav per pyannote segment + re-transcribing through
   Ollama is ~2 hours wall-clock for a 60-min meeting; whisper.cpp word
   timestamps reduce alignment to seconds.
2. PR #15243 is unmerged; the `images:[…WAV]` path is undocumented and
   could be removed in any Ollama minor version.
3. Whisper-large-v3 has SOTA English ASR and is expected to deliver
   15–25% lower WER on noisy meeting audio.

## Decision

Earshot's STT layer will ship two providers behind a single `SttProvider`
interface:

1. **`OllamaChatAudioProvider`** — `POST /api/chat` with
   `images: [base64WAV]`, `model: "gemma4:e4b"`, `options.num_ctx: 8192`,
   audio content placed before the textual instruction. This is the
   primary path because (a) the spec names Gemma 4 and (b) most users will
   already have Ollama running for other reasons.

2. **`WhisperCppHttpProvider`** — POST to a local whisper.cpp HTTP server at
   `localhost:8080/inference`. Recommended for users who care about
   diarization alignment speed or English WER. Returns word-level
   timestamps that Phase 9's `TranscriptAligner` can use.

A `sttProvider: "auto" | "whisper-cpp-http" | "ollama-chat-audio"` setting
(default `"auto"`) controls selection. In `"auto"`, preflight probes
whisper.cpp first; if reachable, uses it. Else probes Ollama; if reachable
with a working `gemma4:e4b`, uses it. Else fails preflight with install
instructions for whisper.cpp.

## Alternatives considered

- **Ollama OpenAI-compat `/v1/audio/transcriptions` (multipart).** Rejected
  — endpoint does not exist.
- **Ollama `/v1/chat/completions` with `audio_url` content.** Rejected —
  not in Ollama's documented schema; PR #15243 may add it but unmerged.
- **Cloud STT (Whisper API, AssemblyAI, Deepgram).** Rejected by spec
  (no cloud, no telemetry, no network beyond localhost during runtime).
- **whisper.cpp as the only provider.** Rejected — the spec explicitly
  named Gemma 4 / Ollama; many users already have Ollama installed and
  prefer not to install a second STT runtime.
- **Ollama as the only provider.** Rejected per Ultraplan R15.4 — too
  fragile (undocumented backward-compat) and too slow for diarization
  alignment.

## Consequences

**Easier:**

- Default path (Ollama) needs zero extra install for users who already
  run Ollama.
- Diarization alignment is fast when whisper.cpp is installed.
- Provider abstraction means Phase 9 can pick the alignment strategy
  per-provider without conditional logic outside `SttProvider`.

**Harder:**

- Two providers to keep working, with separate failure modes.
- The Ollama path depends on undocumented behavior — a single Ollama
  minor release could break it.
- WAV format requirements (16 kHz mono PCM16 ≤30 s, RIFF) are stricter
  for the Ollama path than for whisper.cpp; the helper's WAV chunker
  must satisfy the union of both providers' requirements (already the
  case per PLAN.md § Audio file output).

**Monitor:**

- Ollama PR #15243 (`audios:` field). When merged, the
  `OllamaChatAudioProvider` should be updated to use the documented
  field.
- Ollama issue #15333 (GGML assertion crashes during audio inference).
  Until resolved, `TranscriptionQueue` wraps each `transcribe()` call in
  single-retry logic.
- Whisper.cpp upstream — pin to a tested release; document the
  recommended version in the Brewfile when P0.42 lands.

## References

- Ollama issues: #15427, #15333, #15807; PR #15243
- Plan: `PLAN.md` § "STT path — verified Ollama-only" (superseded) →
  § R15.4 "STT path: restore whisper.cpp as auto-fallback"
- Implementation: Phase 3 (Ollama provider) + restored under Ultraplan
  R15.4 (whisper.cpp provider) — see commit list in `PLAN.md`.
- Related decisions: E-001 (cookie-cutter), E-002 (vuln overrides)
