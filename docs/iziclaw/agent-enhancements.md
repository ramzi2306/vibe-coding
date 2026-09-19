# iziClaw — Agent Enhancements

Status: **Proposed**
Owner: Ramzi IKOUIRENE
Applies to: iziClaw Slack agent (tasks, emails, docs)
Source: `#backbone` thread, Sep 19 — see [Appendix A](#appendix-a--reference-transcript)

---

## 1. Why

iziClaw was introduced in `#backbone` as the agent that "will transform the reported
issues into tasks". In its first real engagement it did two things right (it
acknowledged the role, it surfaced board hygiene) and then stalled: a concrete request
arrived with an attachment, and nothing was created, nothing was confirmed, and the
agent never signalled that it was done.

The gap is not intelligence — it is **engagement lifecycle**. The agent has no notion of
being assigned a job, working it to a confirmed artifact, and then getting out of the
way. This document specifies that lifecycle and the seven enhancements that implement it.

The same lifecycle must govern every artifact iziClaw produces: **tasks, emails, and
docs**. Only the adapter at the end differs.

### 1.1 Observed vs. expected

| # | Observed in `#backbone` | Expected |
|---|---|---|
| 1 | Acknowledged the channel, then volunteered two unrelated board findings | Acknowledge the **assignment**, keep unsolicited findings to the opening turn or a scheduled digest |
| 2 | Never established which project new work lands in | Resolve the project up front — match a dedicated one, or ask once |
| 3 | A concrete request with a screenshot arrived; no artifact was created | Follow the thread, and the moment the request is understood, create the artifact |
| 4 | The screenshot was ignored | Attachments in the source messages ride along onto the artifact |
| 5 | No summary, no confirmation | Post a summary and ask "is this what you needed?" with **Yes** / **Not yet** buttons |
| 6 | Agent stayed ambiently present | On confirmation the agent **retires** from the conversation until called again |

---

## 2. Engagement model

An **engagement** is one unit of delegated work: it starts when someone assigns the
agent something, and ends when the resulting artifact is confirmed (or abandoned).
Everything in this spec hangs off it.

```
                  assignment
   ┌──────────┐    detected    ┌──────────────┐
   │ DORMANT  │───────────────▶│ ACKNOWLEDGED │
   └──────────┘                └──────────────┘
        ▲                             │
        │                             ▼
        │   ┌──────────────┐   ask   ┌──────────┐
        │   │ ASKING_SCOPE │◀────────│ SCOPING  │   destination unknown → ask once,
        │   └──────────────┘────────▶└──────────┘   keep following while waiting
        │                   answered       │
        │                                  │ request understood
        │                                  ▼
        │                            ┌──────────┐
        │                            │ DRAFTING │
        │                            └──────────┘
        │                                  │
        │                                  ▼
        │   ┌───────────┐ "Not yet" ┌───────────────────────┐
        │   │ REVISING  │◀──────────│ AWAITING_CONFIRMATION │
        │   └───────────┘── rev+1 ─▶└───────────────────────┘
        │                                  │
        │              ┌───────────┐       │ "Yes"
        └──────────────│ COMMITTED │◀──────┘
            retire     └───────────┘
```

`CANCELLED` is reachable from any state via an explicit stand-down ("never mind",
"drop it") and also retires the agent.

### 2.1 State semantics

| State | Agent is listening? | Agent may post? |
|---|---|---|
| `DORMANT` | Only for wake signals (§8.1) | No |
| `ACKNOWLEDGED` | Yes | One acknowledgement turn |
| `ASKING_SCOPE` | Yes | One question, then silence until answered |
| `SCOPING` | Yes — silently | No (see §5.3 — silent follow) |
| `DRAFTING` | Yes | No |
| `AWAITING_CONFIRMATION` | Yes | The confirmation card, plus one nudge at 24 h |
| `REVISING` | Yes | One updated card per revision round |
| `COMMITTED` / `CANCELLED` | No | One closing line, then retire |

**Hard rule:** the agent never posts more than one message per state transition. Chatter
per inbound message is the failure mode this replaces.

---

## 3. E1 — Acknowledge the assignment

**Trigger:** the agent is named as the handler of a class of work ("@iziClaw will
transform the reported issues into tasks"), or is directly assigned a job.

The acknowledgement turn must:

1. Restate the job in the agent's own words, so the assigner can catch a misread early.
2. State the **destination** it resolved, or ask for it (§4).
3. State how it will confirm — i.e. that nothing gets created silently.
4. Hand the floor back explicitly.

It must **not** bundle unrelated board findings into the same turn as the assignment
acknowledgement when an assignment is already in flight. Proactive findings are allowed
only:

- in the very first onboarding turn in a channel (as happened in `#backbone`), or
- in a scheduled digest (§9.3),

and never while an engagement is between `SCOPING` and `COMMITTED`.

> **Template**
>
> Got it — I'll turn anything reported here into tasks on **{project}**, with an owner
> and a due date.
> I'll follow the thread, and once I understand a request I'll create the task and post
> a summary here for you to confirm before it's final.
> Fire away.

---

## 4. E2 — Resolve the destination project

Before the agent can create anything it must know **where**. Resolution runs once per
engagement, in this order — first hit wins.

| Order | Signal | Example |
|---|---|---|
| 1 | Explicit in the message | "add this to **Backbone Q3**" |
| 2 | Channel → project binding | `#backbone` → project `Backbone` |
| 3 | Name/keyword match against the project list | "esim booking" → project `eSIM Platform` |
| 4 | Requester's most active project in the last 30 days | tie-breaker only |

### 4.1 Confidence gate

Compute a match score in `[0,1]` for each candidate project.

```
top_score >= 0.80  and  (top_score - runner_up) >= 0.15   →  use it, state it, don't ask
otherwise                                                  →  ask once (§4.2)
```

When the agent proceeds on a confident match it still **names the project** in its next
message. A silently chosen destination is the same bug as a silently created task.

### 4.2 Asking — once, with options

If no dedicated project matches, the agent asks **one** question, offering the top three
candidates plus an escape hatch. It does not ask again for the remainder of the
engagement, and it does not block on the answer: it keeps following the conversation and
drafting while it waits.

> Quick one before I start filing: I don't see a dedicated project for this.
> Which board should these land on?
> `[ Backbone ▾ ]` `[ eSIM Platform ]` `[ Hotel API ]` `[ Somewhere else… ]`

`Somewhere else…` opens a modal with a project picker and a "create a new project"
option.

### 4.3 Binding the answer

The answer is stored as a **channel-level default** (`channel_project_binding`), not a
one-off. Asking the same channel twice which board to use is a regression.

---

## 5. E3 — Follow the conversation, then create

### 5.1 Task-ready criteria

The agent does not create anything until it can fill all four slots from the
conversation:

| Slot | Source | Required? |
|---|---|---|
| **Outcome** — what must exist when this is done | an actionable verb + object | yes |
| **Subject** — the system, endpoint, page, or asset | nouns, links, attachments | yes |
| **Requester** — who asked | message author | yes |
| **Owner** — who does it | @-mention by the requester › channel default › unassigned | no (may be unassigned) |

Plus, when present, it captures: **constraints** ("keep it minimal, no full refactor"),
**deadline**, and **artifact type** (§9).

If the outcome or subject is missing, the agent stays in `SCOPING`. It asks a clarifying
question **only** if the thread has been idle for `clarify_after` (default 10 min) and
the request is still unresolvable — otherwise it waits, because the next message usually
supplies it.

### 5.2 Message coalescing

People type a request across several messages in a row. In the reference thread, one
request arrived as a screenshot plus four consecutive lines inside 60 seconds.

- Coalesce consecutive messages from the same author within `coalesce_window`
  (default 90 s) into **one** candidate request.
- The window restarts on each new message from that author.
- Attachments anywhere in the window belong to the coalesced request.

Producing four tasks from one four-line message is a P1 bug.

### 5.3 Silent follow

Between `SCOPING` and `DRAFTING` the agent posts nothing — no "got it", no "working on
it", no per-message reactions beyond a single 👀 on the message that opened the request.
The next thing the channel hears from it is the confirmation card.

### 5.4 Duplicate guard

Before creating, search the destination project for open artifacts with a title or
subject similarity `>= 0.85`. On a hit, the agent does **not** create a second one — it
offers the existing artifact in the confirmation card instead:

> This looks like the same thing as **t-1ac4f4fa03** (still in *Captured*).
> Want me to add this context to that one instead of opening a new card?
> `[ Use existing ]` `[ Create new anyway ]`

This is the same class of duplicate the agent itself flagged on day one
(`t-1ac4f4fa03` / `t-1adba95790`); it should not be a source of them.

### 5.5 Idempotency

Every create call carries an idempotency key:

```
idem_key = sha256(engagement_id + ":" + artifact_type + ":" + draft_revision)
```

A retry after a timeout, a double-clicked button, or a redelivered Slack event must
never produce a second artifact.

---

## 6. E4 — Carry the attachments

Whatever was attached to the messages that formed the request must end up on the
artifact. In the reference thread the screenshot **is** the request — a task about it
without it is not actionable.

Requirements:

1. Collect every file in the coalescing window (images, PDFs, snippets, and unfurled
   link previews' targets).
2. Fetch via the authenticated Slack file endpoint (`url_private_download` with the bot
   token) — a raw `url_private` in a task description renders as a 403 for anyone
   outside Slack.
3. Re-upload to the artifact store; the artifact references the **re-hosted copy**, so
   it survives Slack retention limits.
4. Preserve the original filename, and caption each file with its source:
   `from @abdelfettah safiddine in #backbone, Sep 19 1:23 PM` + permalink.
5. Always include the **thread permalink** on the artifact, attachments or not.
6. If a fetch fails, still create the artifact, and say so plainly in the confirmation
   card: `⚠️ couldn't attach screenshot.png — linked instead`.

Cap: `max_attachment_mb` (default 25 MB each, 100 MB per artifact). Over the cap → link,
don't re-host, and note it.

---

## 7. E5 — Summarise and confirm

The agent creates the artifact in a **draft/unconfirmed** state, then posts one summary
card asking whether that is what was wanted.

### 7.1 Card contents

| Field | Rule |
|---|---|
| Title | ≤ 80 chars, imperative |
| Project | the resolved destination, named explicitly |
| Owner | resolved per §5.1, or `unassigned` |
| Due | explicit date, or inferred, or `none` — never invented silently |
| Summary | 2–4 lines, in the requester's own terms |
| Constraints | verbatim where possible |
| Attachments | filenames, with the failure note from §6.6 if any |
| Source | permalink to the message that opened the request |

### 7.2 Block Kit payload

```json
{
  "blocks": [
    { "type": "section", "text": { "type": "mrkdwn",
      "text": "*Task drafted — <https://board/t-1b0c9d|t-1b0c9d>*\n*Report: how the `idempotency-key` is currently wired on `POST /v1/esim/book`*" } },
    { "type": "section", "fields": [
      { "type": "mrkdwn", "text": "*Project*\nBackbone" },
      { "type": "mrkdwn", "text": "*Owner*\n@Ouahabi benhenni" },
      { "type": "mrkdwn", "text": "*Requested by*\n@abdelfettah safiddine" },
      { "type": "mrkdwn", "text": "*Due*\nMon 22 Sep" } ] },
    { "type": "section", "text": { "type": "mrkdwn",
      "text": "Write up how the idempotency key works today — where it's generated, how long it's held, what happens on replay and on `INVALID_REQUEST` — so the changes can be scoped on the client side.\n\n*Constraint:* keep it minimal, avoid changes to the backbone and a full refactor." } },
    { "type": "context", "elements": [
      { "type": "mrkdwn", "text": "📎 `esim-book-swagger.png` · <https://slack/permalink|source message>" } ] },
    { "type": "actions", "block_id": "iziclaw_confirm", "elements": [
      { "type": "button", "style": "primary",
        "text": { "type": "plain_text", "text": "Yes" },
        "action_id": "iziclaw_confirm_yes",
        "value": "{\"engagement\":\"eng_8f21\",\"draft\":\"t-1b0c9d\",\"rev\":1}" },
      { "type": "button",
        "text": { "type": "plain_text", "text": "Not yet" },
        "action_id": "iziclaw_confirm_not_yet",
        "value": "{\"engagement\":\"eng_8f21\",\"draft\":\"t-1b0c9d\",\"rev\":1}" } ] }
  ]
}
```

Closing line above the buttons: **"Is this what you needed?"**

### 7.3 Button handling

**Yes** → commit the draft (move out of draft state into the project's intake column),
`chat.update` the card replacing the buttons with `✅ Confirmed by @user`, post one
closing line, retire (§8).

**Not yet** → the agent stays engaged and asks what to change:

> No problem — what should I fix? (title, owner, due date, scope, project, or just tell
> me in your own words)

It applies the correction, increments `rev`, and posts an **updated** card with the same
two buttons. There is no revision limit; each round is one message.

### 7.4 Stale-card safety

- The `rev` in the button value is checked against the engagement's current revision. A
  click on a superseded card returns an ephemeral *"that card is out of date — see the
  latest one above"* and does nothing.
- Buttons are removed from the card the moment either is clicked, so a double click
  cannot double-commit (belt and braces with §5.5).
- Anyone in the channel may click, not just the requester. The card records who did.

### 7.5 Timeouts

| Elapsed in `AWAITING_CONFIRMATION` | Behaviour |
|---|---|
| 24 h | One nudge in-thread |
| 72 h | Leave the artifact as a draft, post *"leaving this as a draft — ping me when you want it filed"*, retire |

---

## 8. E6 — Retire when the job is done

On `COMMITTED` or `CANCELLED` the agent posts one closing line and goes `DORMANT` for
that conversation.

> Filed as **t-1b0c9d** on *Backbone*, owner @Ouahabi benhenni, due Mon 22 Sep. 📎
> screenshot attached.
> I'm out — ping me when there's another one.

Dormant means: the agent reads the channel but **does not act and does not post**. It
does not offer opinions on subsequent messages, does not flag board hygiene, and does not
open a new engagement on its own inference.

### 8.1 Wake signals

An agent in `DORMANT` re-engages only on:

1. A direct `@iziClaw` mention.
2. A reply in a thread the agent owns (its own confirmation card's thread).
3. A click on one of its own buttons.
4. A scheduled trigger it owns (§9.3).
5. An explicit routing rule for the channel (e.g. "every message in `#bugs` is a report"),
   which must be configured per channel and is **off** by default.

Ambient keyword matching ("that's broken", "we should…") is explicitly **not** a wake
signal. Guessing is how an agent becomes noise.

### 8.2 One engagement at a time, per thread

Engagements are keyed by `(channel, thread_ts | root)`. Two simultaneous requests in one
channel from different people open two engagements; the confirmation cards are
independent and each retires on its own. A new request inside a thread whose engagement
is `AWAITING_CONFIRMATION` is queued, not merged, and picked up after that card resolves.

---

## 9. E7 — Same lifecycle for emails and docs

The lifecycle in §2 is artifact-agnostic. Only the terminal adapter changes.

### 9.1 Type router

Decided at `DRAFTING` from the request's verb and object:

| Cue | Type |
|---|---|
| fix, implement, investigate, add, ship, review | **task** |
| send, reply, follow up, chase, notify, "write to" | **email** |
| document, write up, "full report", spec, summarise for | **doc** |

Ambiguous → default to **task**, and offer the alternative on the card:
`[ Yes ]` `[ Not yet ]` `· or make this a doc instead`

The reference request — *"send me the full report on how the idempotency key is
currently setup"* — is a **task** whose deliverable is a **doc**. When the type router
sees this shape it creates the task and notes the expected deliverable, rather than
generating the report unasked.

### 9.2 Adapter contract

Every adapter implements the same five hooks, so the lifecycle code stays shared:

```
resolve_destination()  → project (task) | recipients + thread (email) | space/folder (doc)
build_draft()          → artifact fields + attachments
render_summary()       → Block Kit card (§7.1 fields, per-type)
commit(draft)          → file the task | send the email | publish the doc
retire()               → closing line + DORMANT
```

| | Task | Email | Doc |
|---|---|---|---|
| Destination | project / board | recipients + thread | space + folder |
| Draft state | draft card, not in intake | unsent draft | unpublished page |
| Card shows | project, owner, due | to / cc, subject, first lines | location, title, outline |
| Commit | file into intake column | **send** | publish + post link |
| Attachments | uploaded to the card | added to the message | embedded in the page |

**Emails carry an extra guard:** commit is irreversible and outward-facing, so the
confirmation card is mandatory — no confidence threshold skips it — and the card shows
the full recipient list and the complete body, not a summary of it.

### 9.3 Proactive digest

The board-hygiene observations from the opening turn (overdue cards, duplicates, stale
columns) move out of conversation and into a **scheduled digest** — one message, once a
day, in the channel, owned by the agent and not part of any engagement. Each item gets an
action button so the digest is actionable without a conversation:

> 🔴 **MyBookings Page New Version** — *Under review*, due yesterday `[ Nudge owner ]`
> 📩 2 **Hotel API integration** cards in *Captured* (t-1ac4f4fa03, t-1adba95790)
> `[ Merge ]` `[ Keep both ]`

---

## 10. Data model

```yaml
engagement:
  id: eng_8f21
  channel: C0XXXXXX
  thread_ts: "1758283200.000100"     # null for channel-level
  state: AWAITING_CONFIRMATION
  assigner: U_RAMZI
  requester: U_ABDELFETTAH
  artifact_type: task                 # task | email | doc
  destination:
    kind: project
    id: proj_backbone
    resolved_by: channel_binding      # explicit | channel_binding | keyword | asked
    confidence: 0.91
  draft:
    id: t-1b0c9d
    revision: 1
    fields: { title, summary, owner, due, constraints }
    attachments: [ { slack_file_id, rehosted_url, filename, source_permalink } ]
  source_messages: [ "1758283380.000200", "1758283392.000300" ]
  idem_key: sha256(...)
  created_at / updated_at / retired_at
  audit: [ { at, actor, action, from_state, to_state } ]

channel_project_binding:
  channel: C0XXXXXX
  project: proj_backbone
  set_by: U_RAMZI
  set_at: ...
```

Every state transition appends to `audit`. "Why did it file that?" must be answerable
without reading logs.

---

## 11. Configuration

```yaml
iziclaw:
  coalesce_window_seconds: 90
  clarify_after_minutes: 10
  project_match:
    accept_threshold: 0.80
    margin: 0.15
  duplicate_similarity: 0.85
  confirmation:
    nudge_after_hours: 24
    auto_draft_after_hours: 72
    required_for: [ email ]          # types that can never skip confirmation
  attachments:
    max_mb_per_file: 25
    max_mb_per_artifact: 100
  digest:
    enabled: true
    cron: "0 9 * * 1-5"
  ambient_capture: false             # §8.1(5) — per channel, off by default
```

---

## 12. Acceptance criteria

**AC1 — acknowledgement**
Given the agent is introduced as the handler for a channel, when it replies, then the
reply restates the job, names or asks for the destination project, states that it
confirms before filing, and hands the floor back — in one message.

**AC2 — project match**
Given `#backbone` is bound to project *Backbone*, when a request arrives, then the agent
files there and names the project in its card, without asking.

**AC3 — project unknown**
Given no binding and no candidate scores ≥ 0.80, when a request arrives, then the agent
asks once with up to three candidates plus an escape hatch, and stores the answer as a
channel binding. It must not ask again in that channel.

**AC4 — coalescing**
Given one screenshot followed by four messages from the same author within 90 s, when the
agent drafts, then **exactly one** artifact is created.

**AC5 — silence while scoping**
Given a request the agent cannot yet resolve, when further messages arrive, then the
agent posts nothing until either the confirmation card or (after 10 min idle) one
clarifying question.

**AC6 — attachments**
Given a request with a screenshot, when the artifact is created, then the screenshot is
re-hosted on the artifact, captioned with author/channel/time, and the thread permalink
is present. A fetch failure surfaces in the card, and does not block creation.

**AC7 — confirmation**
Given an artifact is drafted, when the agent posts, then the card carries title, project,
owner, due, summary, constraints, attachments, source link, and **Yes** / **Not yet**.

**AC8 — Yes**
When **Yes** is clicked, then the artifact is committed, the buttons are replaced with a
confirmed marker, one closing line is posted, and the engagement retires.

**AC9 — Not yet**
When **Not yet** is clicked, then the agent asks what to change, applies it, and re-posts
an updated card with the same buttons at `rev+1`. A click on `rev` returns an ephemeral
stale-card notice and changes nothing.

**AC10 — retirement**
Given an engagement is `COMMITTED`, when unrelated messages follow in the channel, then
the agent posts nothing until a §8.1 wake signal.

**AC11 — duplicates**
Given an open artifact with similarity ≥ 0.85, when the agent drafts, then it offers
*Use existing* / *Create new anyway* rather than silently creating a second one.

**AC12 — idempotency**
Given a redelivered Slack event or a double-clicked button, when handled, then exactly
one artifact exists.

**AC13 — parity**
AC4–AC10 hold identically for `artifact_type` = `email` and `doc`, with email's
confirmation card non-skippable and showing the full recipient list and body.

---

## 13. Rollout

| Phase | Scope | Exit criteria |
|---|---|---|
| 1 | Lifecycle + tasks, `#backbone` only, digest off | AC1–AC12 green for two weeks |
| 2 | Docs adapter, digest on | Report-shaped requests routed correctly |
| 3 | Email adapter, send behind mandatory confirmation | Zero unconfirmed sends |
| 4 | Additional channels via `channel_project_binding` | — |

Kill switch: `ambient_capture: false` plus removing the channel binding returns the agent
to mention-only operation without a deploy.

---

## Appendix A — Reference transcript

`#backbone` — *Backbone related issues*, Sep 19. This is the fixture for AC1–AC9.

> **Ramzi IKOUIRENE** · 1:20 PM
> hello @abdelfettah safiddine @Ouahabi benhenni Here is the official channel to discuss
> requests/issue related issues
> @iziClaw will transform the reported issues into tasks

> **iziClaw** · 1:20 PM
> Got it, Ramzi - this is the right way to run it. Drop any request or issue here and
> I'll turn it into a proper task on the board, with an owner and a due date, so nothing
> gets lost in chat.
> Two things worth flagging while we're setting this up:
> • 🔴 **MyBookings Page New Version** is sitting in **Under review** and its due date was
> yesterday (Sep 19) - worth a look before it slips further.
> • 📩 There are **2 Hotel API integration cards** still in **Captured** (t-1ac4f4fa03,
> t-1adba95790) - looks like a duplicate. Want me to merge them into one and assign it?
> So @abdelfettah safiddine @Ouahabi benhenni - fire away, and I'll take it from there.

> **abdelfettah safiddine** · 1:23 PM
> @Ouahabi benhenni
> *[screenshot: Swagger `POST /v1/esim/book` — "Commander des eSIM", `idempotency-key`
> header circled, marked OBLIGATOIRE]*
> as said in private
> send me the full report on how the idompotency key is currectly setup
> so that i will see if its possible to do all the changes from my side, and avoid changes
> to the backbone directly
> to keep it minimale without full code refactoring

**What the agent should have done**

1. §3 — the 1:20 PM turn is the acknowledgement; the two findings are acceptable there
   (onboarding turn) but move to the digest from then on (§9.3).
2. §4 — bind `#backbone` → *Backbone*, and say so.
3. §5.2 — coalesce the 1:23 PM screenshot and the four lines into **one** request.
4. §5.1 — outcome: *a written report on the current idempotency-key setup*; subject:
   `POST /v1/esim/book`; requester: abdelfettah; owner: Ouahabi (the person abdelfettah
   @-mentioned); constraint: *minimal, no backbone changes, no full refactor*.
5. §9.1 — type **task**, deliverable **doc**.
6. §6 — re-host the Swagger screenshot onto the card.
7. §7 — post the card from §7.2 and wait.
8. §8 — on **Yes**: file it, post the closing line, retire.
