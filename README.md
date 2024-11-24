# Server GitHub Package

This is a utility package that provides reusable functions for various projects.

## Installation

You can install this package using npm/GitHub Packages:

```
bun add @gotpop-platform/package-server
```

```
"@gotpop-platform/package-server": "1.0.0"
```

## Usage

```typescript
import { jsxFactory } from "@gotpop-platform/package-server"
```

## Contributing

If you would like to contribute to this package, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.


```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#e1f5fe',
    'primaryTextColor': '#000',
    'primaryBorderColor': '#00b0ff',
    'lineColor': '#00838f',
    'secondaryColor': '#fff8e1',
    'tertiaryColor': '#f3e5f5'
  }
}}%%

graph TD
    classDef default fill:#e1f5fe,stroke:#00b0ff,stroke-width:2px;
    classDef process fill:#fff8e1,stroke:#ffa000,stroke-width:2px;
    classDef decision fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    A[Start Server] --> B[Load Initial Content]
    B --> C[Initialize Bun Server]
    
    C -->|Incoming Request| D{Request Type?}
    D -->|WebSocket| E[Handle WebSocket]
    D -->|HTTP| F[Process HTTP Request]
    
    F -->|Static Asset| G[Handle Static Assets]
    F -->|Page Request| H[Handle Page Rendering]
    
    I[File Watcher] -->|File Change| J{File Type?}
    J -->|CSS/JS/TS| K[Rebuild Files]
    J -->|Content| L[Reload Content]
    
    K -->|Success| M[Update Script Paths]
    M --> N[Notify WebSocket Clients]
    L --> N

    class D,J decision;
    class K,L,M process;
```