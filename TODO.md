# TODO for major refactor

## Bot structure

```
src/
├─ command/
│  ├─ admin/
│  ├─ member/
│  ├─ guard/
│  │  └─ guard.type.ts
│  ├─ command.ts
│  └─ command-context.type.ts
├─ config/
│  ├─ defaults.ts
│  └─ env.ts
├─ core/
│  ├─ types.ts
│  ├─ manager/
│  │  ├─ region-manager.ts
│  │  ├─ player-manager.ts
│  │  ├─ queue-manager.ts
│  │  ├─ match-manager.ts
│  │  └─ draft-manager.ts
│  ├─ sync/
│  │  ├─ sync-commands.ts
│  │  ├─ sync-channels.ts
│  │  ├─ sync-roles.ts
│  │  ├─ sync-members.ts
│  │  └─ sync-data.ts
│  └─ elo.ts
├─ db/
│  └─ prisma.ts
├─ discord/
│  ├─ interaction-utils.ts
│  ├─ embed/
│  │  ├─ match-embed.ts
│  │  └─ player-embed.ts
│  ├─ ui/
│  │  ├─ draft-ui.ts
│  │  └─ report-ui.ts
│  └─ match-messages.ts
├─ debug-utils.ts
└─ index.ts
```

## Setup flow

- add game ✅
    - create draft sequence ✅
    - edit terrains
    - edit characters
- list games
    - list game regions
    - list game modes
        - list terrains
        - list characters
        - list draft sequences
