# Gloop Finance Backend

## Overview

The Gloop Finance backend is a NestJS web server that powers the Gloop Finance DeFi protocol on Arbitrum. [Gloop Finance](https://gloop.finance/) is a GMX yield optimizer offering two main features:

1. **GMI (GM Index Token)**: An ERC-20 index token that provides a curated basket of GMX market tokens (GM: BTC/USD, GM: ETH/USD, GM: SOL/USD, GM: SWAP-ONLY) with algorithmically optimized weights for optimal risk-return ratios.

2. **GM Lending/Borrowing Platform**: A decentralized, non-custodial lending and borrowing platform that enables users to leverage GM assets as collateral to borrow USDC, allowing for strategic leverage and yield optimization.

For more information, please see the docs: [Gloop Finance Docs](https://docs.gloop.finance/)

The backend aggregates on-chain data, maintains a database cache for efficient UI querying, and provides RESTful APIs for the [web frontend application](https://github.com/timrolsh/gloop-frontend). It handles real-time event monitoring, user metrics calculation, points system tracking, and liquidation monitoring.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
  - With scheduling for cron jobs and scheduled tasks
- **Database**: PostgreSQL with TypeORM
  - With views for efficient querying
- **Blockchain Integration**: [Ethers.js v6](https://docs.ethers.org/)
- **Authentication**: JWT-based authentication with SIWE (Sign-In With Ethereum) support

## Architecture

### Core Modules

- **Watcher Module**: Monitors smart contract events in real-time via WebSocket connections
- **Transaction Module**: Manages transaction records and provides liquidation data
- **Wallet Module**: Handles wallet entities and user dashboard/leaderboard queries
- **Staking Module**: Tracks GLOOP staking events and boost calculations
- **Block Checker Module**: Updates wallet health factors and USDC debt from on-chain state
- **Auth Module**: Handles wallet-based authentication and JWT token management
- **Liquidation Module**: Provides liquidation position data for monitoring

### On-Chain Data Aggregation

1. **Real-Time Event Monitoring**: `WatcherService` connects to Arbitrum via WebSocket providers and listens for smart contract events:
   - `Deposit` - Users depositing assets as collateral
   - `Withdraw` - Users withdrawing collateral
   - `Borrow` - Users borrowing USDC
   - `Repay` - Users repaying USDC debt
   - `Liquidation` - Liquidation events
   - `Stake` - GLOOP staking events
   - `Unstake` - GLOOP unstaking events

2. **Historical Data Sync**: On initialization, the service syncs historical events from approximately 6 months back to populate the database with complete transaction history.

3. **Database Caching**: All on-chain events are stored in PostgreSQL tables (`transactions`, `staking_events`, `blocks`, `wallets`) to create a queryable cache. This eliminates the need for long and expensive, on-chain queries of static historical data during frontend operations.

4. **State Updates**: After each event, the system:
   - Ensures wallet records exist
   - Updates wallet health factors (calculated from on-chain contract state)
   - Updates USDC debt balances
   - Stores transaction records with block timestamps

### PostgreSQL Views and User Metrics

The backend uses PostgreSQL views (defined in the [database migrations](./src/database/migrations/1758766450000-AddPointsLeaderboardViews.ts)) for complex user metrics without requiring application-level aggregation. These views are defined in database migrations and are populated with both historical and live data. The views are:

1. **wallet_points_detailed**: Calculates points earned per wallet per time period following the GM Points Program rules:
   - Tracks initial balances before the program start
   - Creates a unified timeline of all events (transactions, staking, lock expiries)
   - Calculates running balances (lending, borrowing, staking) at each event
   - Computes points for each period between events based on:
     - Base lending points: 2 points per dollar per 1000 seconds
     - Base borrowing points: 1 point per dollar per 1000 seconds
     - Boosted lending/borrowing points based on staking multipliers
   - Handles staking boost multipliers (10% for unlocked, 25% for 14-day lock, 50% for 28-day lock, 100% for 56-day lock)
   - Applies the "lesser of" rule (boost applies only up to the lesser of staked GLOOP vs lent/borrowed USDC)

2. **wallet_current_staking_boost**: Tracks the current staking boost status for each wallet, accounting for lock expiry.

3. **points_leaderboard**: Aggregates the detailed view into a simple leaderboard format with:
   - Total points per wallet
   - Total lending and borrowing points
   - Current balances and staking status
   - Rank calculation

## Key Features

### User Dashboard API

- Provides comprehensive user statistics including:
  - Points earned (total, lending, borrowing)
  - Current lending/borrowing balances
  - Staking status and boost multipliers
  - Leaderboard rank

### Leaderboard API

- Efficiently queries the `points_leaderboard` view
- Supports pagination for large result sets
- Returns ranked user data with current status

### Liquidation Monitoring

- Aggregates collateral data across multiple assets (BTC, ETH, SOL)
- Calculates health factors for all positions
- Provides paginated liquidation candidate lists sorted by health factor

### Authentication

- Wallet-based authentication using SIWE (Sign-In With Ethereum)
- JWT token generation and validation
- Public and protected route decorators

## Deployment

The application is containerized using Docker. See `Dockerfile` and `docker-compose.yml` for containerization configuration.

```bash
# Build and push container
docker compose build backend
docker push registry.digitalocean.com/gloop/backend
```

To start a local Postgres database, run:

```bash
docker compose up db
```
