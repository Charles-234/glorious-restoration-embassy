# Source Citation Policy

The AI assistant always returns its sources with every answer.

## Why We Cite Sources

1. **Transparency** — users can verify claims, catch hallucinations, and
   research further.
2. **Accountability** — if the AI says something wrong, we can trace exactly
   which source produced it and either correct the source or the prompt.
3. **Trust** — a church assistant that shows its work is more credible than
   one that hides it.

## How Sources Are Ranked

1. **Local documents** (type: `document`) — from `content/documents/` in the
   church repo. These are the highest-trust sources.
2. **Web results** (type: `web`) — from DuckDuckGo. Used only when the local
   knowledge base has nothing relevant.

When you add church PDFs to `content/documents/`, they will rank above web
results automatically.

## Future Improvements

- Show a checkmark next to `document`-type sources in the UI
- Cache source titles at query time so they don't drift
- Display a "sources checked on <date>" line
