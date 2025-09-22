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

## DB structure

id + created + updated in every table

Server

- discord id
- bot commands discord channel id
- bot actions discord channel id (with buttons) (maybe)
- queue discord channel id
- match history discord channel id
- bot moderator discord role id
- registered discord role id
- queue discord role id
- lobby discord role id (maybe)
- match discord role id

Profile

- discord id
- server id
- in-game name
- description
- rating

Profile Region

- profile id
- name

Game

- name

Terrain

- game id
- name

Character

- game id
- name

Server Terrain

- server id
- terrain id
- weight

Server Character

- server id
- character id
- restrictions

Draft Sequence

- server id
- name
- type (draft sequence enum)
- team size

Draft Step

- draft sequence id
- type (draft type enum)
- order

Match Type

- server id
- game id
- draft sequence id
- team count

Queue Entry

- match type id
- profile id

Match

- server id
- match type id
- server terrain id
- private
- lobby code
- state (match state enum)
- history discord message id
- team win

Match Team

- match id
- order
- team discord channel id
- draft discord message id

Match Player

- profile id
- match team id
- captain
- team win report
- drop report
- rating change

Match Draft Action

- match team id
- character id
- type (draft type enum)
- draft order
- global
