import { Module } from '@nestjs/common';

// Weekly drop pipeline lives here. Temporal worker orchestrates:
//   retrieval (pgvector) → ranker → narrative gen → curator queue → delivery.
// See docs/ARCHITECTURE.md "matchmaking".
@Module({})
export class MatchesModule {}
