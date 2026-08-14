# Phase 1 / Gate 2 — authoritative historical timezone pipeline

## Canonical contract

- Public callers provide local birth date/time, place text, and coordinates.
- The server derives the IANA timezone from coordinates using `tz-lookup`.
- `@js-temporal/polyfill` resolves the exact historical offset and DST rule for the local birth date/time.
- Numeric UTC offsets and client-provided timezone labels are not part of the public calculation contract and are ignored if sent by an older or tampered client.
- Nonexistent local times fail with `NONEXISTENT_LOCAL_TIME`.
- Ambiguous local times fail with `AMBIGUOUS_LOCAL_TIME` until `earlier` or `later` is supplied.
- Results include `calculationVersion`, `birthUtc`, `utcOffsetMinutes`, and exact `utcOffsetSeconds`.

Calculator, comparison, embed, HumanDesignTest, celebrity, return-chart and GPT entry points all call the same server calculator contract.

## Fixture verification status

The UTC conversion fixtures in `timezone.test.ts` are independently checked against IANA historical timezone rules exposed by Temporal:

- Prague summer and winter offsets;
- Prague 2024 spring nonexistent local time;
- Prague 2024 autumn ambiguous local time, including both exact instants;
- Berlin/Ulm 1879 local mean time down to offset seconds.

The Human Design golden fixtures are explicitly **regression baselines**, not independently certified astronomical charts. They lock deterministic behavior for Ra Uru Hu, Albert Einstein, and a Prague baseline. Their chart facts must not be advertised as independently verified until compared against a named external ephemeris/calculator with a documented methodology.

## Stored-chart compatibility

No database migration is required for Gate 2 and no existing `charts.chartData` row is modified.

- Existing stored charts remain readable as legacy results without `calculationVersion`.
- Newly calculated charts carry `calculationVersion: 2.0.0-iana` and canonical UTC metadata.
- Recalculation can change historical results where a legacy chart used a longitude-rounded offset, a fixed abbreviation such as CET/EST, or ignored DST.
- Gate 2 does not recalculate stored charts. A future opt-in migration must preserve the old payload and record before/after calculation versions.
