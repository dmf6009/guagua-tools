---
{
 "order": 7,
 "group": "Debug MCP servers",
 "category": "MCP Tasks",
 "title": "MCP Task Stuck in 'working'? Debug Polling, TTL & Status Transitions",
 "h1": "Find why an MCP Task never leaves \"working\"",
 "description": "Debug long-running MCP Tasks: the task state machine, tasks/get polling and pollInterval, ttl expiry, tasks/result blocking, input_required, illegal status transitions, and what changed in the 2026-07-28 Tasks extension.",
 "deck": "A task that stays in \"working\" forever is rarely still working. Either the server lost it, the client is asking the wrong question, or the task is waiting for input nobody delivered. A short sequence of snapshots tells you which.",
 "published": "2026-07-29",
 "updated": "2026-11-12",
 "tools": [["MCP Task Trace", "https://mcptasks.guagua-alvin.top/"]],
 "related": ["migrate-mcp-2026", "mcp-server-not-connecting", "fix-mcp-app-blank-ui"],
 "cta": {"title": "Read the trace, not one snapshot", "text": "Paste a series of task responses as JSONL. The validator checks every transition, timestamp and field against the lifecycle rules and points at the first one that breaks them.", "label": "Open MCP Task Trace", "url": "https://mcptasks.guagua-alvin.top/"},
 "sources": [
  ["MCP specification 2025-11-25: tasks", "https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks"],
  ["The 2026-07-28 MCP specification release candidate", "https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/"],
  ["RFC 3339: date and time on the Internet", "https://www.rfc-editor.org/rfc/rfc3339"]
 ],
 "faq": [
  ["What are the valid MCP task statuses?", "There are five: <code>working</code>, <code>input_required</code>, <code>completed</code>, <code>failed</code> and <code>cancelled</code>. A task always starts as <code>working</code>. The last three are terminal, and a task in a terminal status must never change again."],
  ["How often should a client poll an MCP task?", "Use the <code>pollInterval</code> value, in milliseconds, that the server returns with the task. It is a suggestion from the server about how often <code>tasks/get</code> is useful. If it is absent, choose a conservative interval and back off; polling in a tight loop is the fastest way to get rate-limited."],
  ["What does ttl mean on an MCP task?", "<code>ttl</code> is the time in milliseconds, measured from <code>createdAt</code>, for which the server promises to keep the task and its result. After that the server may delete it, even if it never finished, and <code>tasks/get</code> will return an error saying the task was not found. The server may override the ttl the client asked for."],
  ["Does tasks/result return immediately?", "In the 2025-11-25 specification it does not. <code>tasks/result</code> blocks until the task reaches a terminal status and then returns exactly what the original request would have returned. In the 2026-07-28 Tasks extension, <code>tasks/result</code> is removed and the result is delivered through <code>tasks/get</code>."]
 ]
}
---
## The lifecycle in one table

Tasks let a server accept a slow request, return a handle straight away, and deliver the real result later. They were introduced as an experimental feature in the 2025-11-25 specification and became an official extension in 2026-07-28. Both versions share the same state machine:

| Status | Meaning | May move to |
|---|---|---|
| `working` | The request is being processed. Every task starts here. | `input_required`, `completed`, `failed`, `cancelled` |
| `input_required` | The server needs something from the requestor before it can continue. | `working`, `completed`, `failed`, `cancelled` |
| `completed` | Finished successfully; the result is available. | — terminal |
| `failed` | Did not finish successfully. For tool calls this includes a result with `isError: true`. | — terminal |
| `cancelled` | Stopped at the requestor's request. | — terminal |

A task object looks like this:

```json
{
  "taskId": "786512e2-9e0d-44bd-8f29-789f320fe840",
  "status": "working",
  "statusMessage": "Rendering page 14 of 60",
  "createdAt": "2026-11-12T10:30:00Z",
  "lastUpdatedAt": "2026-11-12T10:31:40Z",
  "ttl": 600000,
  "pollInterval": 5000
}
```

`createdAt` and `lastUpdatedAt` are required RFC 3339 timestamps. `ttl` and `pollInterval` are in milliseconds.

## Capture a trace before you change anything

One response cannot tell you whether a task is progressing. Record several consecutive `tasks/get` responses, one JSON object per line, with the time you received each:

```bash
while true; do
  curl -s https://mcp.example.com/mcp \
    -H "Content-Type: application/json" -H "Accept: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tasks/get","params":{"taskId":"786512e2-9e0d-44bd-8f29-789f320fe840"}}' \
    >> trace.jsonl
  echo >> trace.jsonl
  sleep 5
done
```

Then compare the lines. The pattern you see points to the cause.

## Pattern 1: status and lastUpdatedAt never change

```text
working  lastUpdatedAt=10:31:40
working  lastUpdatedAt=10:31:40
working  lastUpdatedAt=10:31:40
```

The server is not touching the task. The background job has crashed, was never started, or runs in a different process that cannot write to this task store. Check, in this order:

- **Was the work actually scheduled?** A handler that creates the task record and returns, but forgets to start the job, produces exactly this trace.
- **Did the worker die?** An unhandled exception in a background coroutine or thread is often logged nowhere. Wrap the job so that any error moves the task to `failed` with a `statusMessage`.
- **Is the store shared?** With several server instances and an in-memory task store, the instance that answers `tasks/get` may not be the one doing the work. Tasks need storage every instance can read.

A server should never leave a task in `working` after the work has ended. Every exit path, including timeouts and process shutdown, needs to write a terminal status.

## Pattern 2: lastUpdatedAt advances but status stays working

```text
working  lastUpdatedAt=10:31:40  "Rendering page 14 of 60"
working  lastUpdatedAt=10:32:10  "Rendering page 19 of 60"
```

The task is alive and simply slow. Nothing is broken. Show the `statusMessage` to the user, keep to the `pollInterval`, and check that the `ttl` is long enough for the job to finish.

## Pattern 3: "task not found" after a while

The task's `ttl` elapsed and the server deleted it. `ttl` counts from `createdAt`, not from completion, so a job that takes eleven minutes with a ten-minute ttl disappears before its result can be read. This is allowed behaviour: after the ttl a server may delete a task regardless of its status.

Fixes: request a longer `ttl` when creating the task, have the server choose a ttl that covers the realistic worst case, and always read the `ttl` in the response, because the server may have overridden the value you asked for. An error with code `-32602` and a message such as *Task not found* or *Task has expired* is the signature of this problem.

## Pattern 4: the task is waiting in input_required

`input_required` is not a kind of `working`. It means the server has a question, typically an elicitation, and will not continue until it is answered. A client that only polls `tasks/get` will see `input_required` forever.

In the 2025-11-25 design, the client must call `tasks/result` when it sees this status. That call opens the channel on which the server sends its request, tagged with `io.modelcontextprotocol/related-task` so the client knows which task it belongs to. Once the client replies, the task returns to `working`.

In the 2026-07-28 extension the mechanism is simpler: the client sends the missing input with `tasks/update`.

## Pattern 5: the client is blocked, not the task

In 2025-11-25, `tasks/result` **blocks until the task is terminal**. A client that calls it immediately after creating a task and waits with a short HTTP timeout will see a timeout and may report the task as hung, while the server is working normally. Poll `tasks/get` until the status is terminal, then call `tasks/result`. If you do block on `tasks/result`, make sure every proxy between you and the server allows a response that long.

## Pattern 6: impossible transitions

These indicate a server bug, and a strict client may reject the whole task:

| Seen in the trace | Rule broken |
|---|---|
| `completed` → `working` | Terminal statuses must never change |
| `cancelled` → `completed` | A cancelled task stays cancelled even if the work finishes afterwards |
| First status is `completed` or `input_required` | Tasks must begin as `working` |
| `lastUpdatedAt` earlier than `createdAt`, or going backwards | Timestamps must be consistent |
| `taskId` changes between responses | The ID is fixed when the task is created |
| A status such as `running`, `done` or `error` | Only the five defined values are valid |
| Missing `createdAt` or `lastUpdatedAt` | Both are required in every task response |

The cancellation race is the one most often missed: the client cancels, the server marks the task `cancelled`, and a few seconds later the worker finishes and overwrites the status with `completed`. Guard every status write with a check that the current status is not terminal.

## Before a task is even created

If the server answers a task-augmented call with an ordinary result, or with a `-32601` error, the negotiation failed before any task existed:

- In 2025-11-25 the server must declare `tasks.requests.tools.call` in its capabilities, and each tool states its own position through `execution.taskSupport`: `forbidden` (the default), `optional` or `required`. Calling a tool as a task when it does not allow it returns `-32601`; so does calling a `required` tool without a task.
- The client asks for a task by adding a `task` object to the request parameters, for example `"task": {"ttl": 600000}`.

## What changes in the 2026-07-28 Tasks extension

If you built on the experimental API, plan a migration. The differences that matter for debugging:

| 2025-11-25 (experimental core feature) | 2026-07-28 (extension `io.modelcontextprotocol/tasks`) |
|---|---|
| The client decides to create a task by sending `params.task` | The client advertises the extension; the server decides when a call becomes a task |
| `tasks/result` blocks and returns the result | Removed. Poll `tasks/get`; the result arrives with the terminal state |
| `tasks/list` enumerates tasks | Removed, because it cannot be scoped safely without sessions |
| Input delivered through a request on the `tasks/result` stream | `tasks/update` carries client input |
| `tasks/cancel` | Unchanged in purpose |

A client that still calls `tasks/result` or `tasks/list` against a 2026-07-28 server gets "method not found". The [stateless migration guide](/guides/migrate-mcp-2026) covers the surrounding protocol changes.

## Checklist for a healthy task implementation

- Return the task handle quickly; do the work elsewhere.
- Update `lastUpdatedAt` and `statusMessage` as the job progresses.
- Write a terminal status on every exit path, including crashes and shutdown.
- Never modify a task that is already terminal.
- Choose a `ttl` longer than the slowest realistic run, and report the real value.
- Bind tasks to the caller's authorization context, and use unguessable task IDs.
- Keep task state in storage shared by every server instance.

> A task ID is a capability: anyone who holds it can read the result unless the server ties tasks to an authenticated caller. Treat IDs in logs and bug reports with the same care as any other access token.
