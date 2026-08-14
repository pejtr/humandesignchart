# Phase 1 / Gate 4 — AI ownership and canonical grounding

## Correctness boundary

The owned-reading path now follows this order:

1. authenticate the user;
2. load `chartId` by both chart ID and owner ID;
3. runtime-validate the stored canonical `ChartResult`;
4. construct the prompt and immutable fact manifest on the server;
5. generate a complete structured response;
6. validate the returned manifest against the canonical chart;
7. persist the verified interpretation and consume any credit in one database transaction;
8. deliver the persisted result.

Token-level provider streaming is disabled for this path. The compatibility SSE endpoint sends one complete, already grounded and persisted payload. Raw model output is never sent to the client.

## Immutable facts and interpretation

The internal model response has two separate fields:

- `facts`: Type, Strategy, Authority, Profile, Definition, Centers, Channels and Gates;
- `interpretationMarkdown`: non-authoritative themes, examples, prompts and observations.

The canonical fact manifest must exactly match the stored chart. A malformed response or any mismatch is rejected with a structured grounding failure and is not persisted as successful.

The Hero's Journey is retained only as an interpretation frame: the user is the hero, the chart is a map and Marie is a guide. It has no authority to change deterministic facts or replace the user's agency.

## Ownership and input contract

Client input is strict and limited to:

- owned `chartId`;
- supported `readingType`;
- optional user question;
- locale.

Client-supplied chart facts are rejected. Missing and non-owned IDs share the same `Chart not found` response to avoid ownership disclosure.

## Credit and persistence semantics

The service does not call persistence after provider timeout, invalid structured output or grounding failure. For a valid result, credit decrement and reading insert run in one database transaction. An insert failure rolls back the credit decrement. A reading is billable only after grounding and successful persistence.

## Telemetry

Verified readings record model, prompt version, latency, input tokens, output tokens and grounding status. Estimated cost remains nullable because no authoritative per-model price table is maintained in this application.

## Migration and compatibility

Migration `drizzle/0018_chemical_sasquatch.sql` adds nullable telemetry fields and a non-null `groundingStatus` with the safe default `legacy`. It has been generated but not applied.

No stored chart is silently modified. Older or malformed stored charts that do not satisfy the canonical runtime schema receive an explicit recalculation precondition before an AI reading can be generated.

## Deferred product work

Out of scope for Phase 1 and recorded as P1:

- visually separate and reduce the embed-calculator block on the calculation page;
