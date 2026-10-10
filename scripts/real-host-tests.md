# Real host integration tests

Run against a local Lumiverse checkout with its dependencies installed:

```powershell
bun run build
bun run test:host G:\mousepad_git\Lumiverse
```

The script installs the current `dist` bundles into a new directory under
`local/real-host/<timestamp>/`, grants their declared permissions in that test
instance, and boots Lumiverse. It uses ports 18760 (host) and 18761 (model fixture).
Existing host data and installed extensions are not modified. Do not run two
instances of this script simultaneously.

The database, migrations, authentication, HTTP routes, WebSocket messages,
Spindle worker/RPC, storage, host events, prompt assembly, and provider request
construction are real. The model is a local deterministic HTTP SSE provider
that captures requests and can fail or delay responses. No paid model calls or
private chats are needed.

Coverage includes deleted message indexes; manual and automatic filing;
chapter/arc regeneration; all-hidden prompt injection; fork ownership and source
remapping; nested deletion and coverage repair; provider failure/retry;
cancellation; source edits during generation; preview acceptance and stale
preview rejection; release/wipe visibility; restart persistence; diagnostics
privacy, opt-out, clearing and actual 10 MB eviction. The long-history case
creates 1,445 messages, deletes five, files 92 chapters manually, changes lag
and window, then files 29 chapters automatically and forks the result. It checks
every filed source against the actual provider requests and stored ranges.

Success exits zero and writes `report.json`, including tested revisions, bundle
hashes, scenario results, duration, and diagnostics counters. A failure exits
nonzero and writes synthetic request/state evidence to `failure.json`. Artifacts
stay in the ignored `local` directory. Model quality, remote-provider behavior,
other runtime versions, and browser behavior are not established by this script.

For a separate browser check, add `--keep-open`. The test account details are
written to `local/real-host-browser.json`; open `http://localhost:18760`, then
check Books → Advanced → Private diagnostics. Verify Export downloads parseable
JSON and that the opt-out survives a page reload. To stop the retained test
instance, create an empty `stop` file in the run directory printed by the script.
The normal run shuts down its extension worker automatically.
