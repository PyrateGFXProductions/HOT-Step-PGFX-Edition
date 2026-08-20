import sys

def update_server():
    with open('server/server.mjs', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update proxy functions
    old_proxies = """/* ── Video Prompt Builder (LTX 2.3 motion-first; delegates to services/prompt-builder.mjs) ── */
function buildVideoPrompt({ imagePrompt, sectionType, vocalistGender, segmentLines, concept, style }) {
  return buildVideoPromptMod({ imagePrompt, sectionType, vocalistGender, segmentLines, concept, style });
}
function buildVideoMotionPrompt({ segmentLines, sectionType, concept, style, vocalistGender }) {
  return buildVideoMotionPromptMod({ segmentLines, sectionType, concept, style, vocalistGender });
}
/* ── MiniMax H3 I2V motion prompt (short, model-correct; delegates) ── */
function buildH3MotionPrompt({ segmentLines, sectionType, concept, style }) {
  return buildH3MotionPromptMod({ segmentLines, sectionType, concept, style });
}"""

    new_proxies = """/* ── Video Prompt Builder (LTX 2.3 motion-first; delegates to services/prompt-builder.mjs) ── */
function buildVideoPrompt(opts) {
  return buildVideoPromptMod(opts);
}
function buildVideoMotionPrompt(opts) {
  return buildVideoMotionPromptMod(opts);
}
/* ── MiniMax H3 I2V motion prompt (short, model-correct; delegates) ── */
function buildH3MotionPrompt(opts) {
  return buildH3MotionPromptMod(opts);
}"""

    if old_proxies in content:
        content = content.replace(old_proxies, new_proxies)
        print("Updated proxy functions")
    else:
        print("Warning: old_proxies not found")

    # 2. Update video-plan endpoint
    old_plan = """      /* PGFX 2026-08-10: per-segment LTX 2.3 MOTION prompt — the image keyframe
         prompt (FLUX.2) and the motion prompt (LTX 2.3) are different animals.
         One Master Creative Brief drives both. */
      const motionPrompt = buildVideoMotionPrompt({
        segmentLines: sec.lines,
        sectionType: sec.sectionType,
        concept: songConcept,
        style: resolvedStyle,
        vocalistGender: vocalistGender || ""
      });
      /* PGFX 2026-08-11: per-model prompts — MiniMax H3 gets its OWN shorter
         motion prompt (no LTX camera-intent sentence; H3 composes the shot
         itself). The client picks prompt by engine. */
      const h3MotionPrompt = buildH3MotionPrompt({
        segmentLines: sec.lines,
        sectionType: sec.sectionType,
        concept: songConcept,
        style: resolvedStyle
      });"""

    new_plan = """      /* PGFX: Context-aware LTX 2.3 & MiniMax H3 motion prompts */
      const motionPrompt = buildVideoMotionPrompt({
        segmentLines: sec.lines,
        sectionType: sec.sectionType,
        concept: songConcept,
        style: resolvedStyle,
        vocalistGender: vocalistGender || "",
        subject: resolvedSubject || ""
      });
      const h3MotionPrompt = buildH3MotionPrompt({
        segmentLines: sec.lines,
        sectionType: sec.sectionType,
        concept: songConcept,
        style: resolvedStyle,
        subject: resolvedSubject || ""
      });"""

    if old_plan in content:
        content = content.replace(old_plan, new_plan)
        print("Updated video-plan endpoint")
    else:
        print("Warning: old_plan not found")

    with open('server/server.mjs', 'w', encoding='utf-8') as f:
        f.write(content)
    print("server.mjs successfully updated")

if __name__ == '__main__':
    update_server()
