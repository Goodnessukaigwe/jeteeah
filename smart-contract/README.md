# Jeteeah - Snake Game on Linera

A fully functional Snake game smart contract built on the Linera blockchain platform.

## 🎮 Features

The contract implements a complete Snake game with the following functions:

1. **start_game()** - Initialize a new game
2. **move_snake(direction)** - Move the snake in a direction (Up, Down, Left, Right)
3. **check_collision()** - Internal collision detection (walls and self)
4. **eat_food()** - Process food consumption
5. **spawn_food()** - Generate new food positions
6. **end_game()** - End current game and award points
7. **get_game_state(player)** - Query a player's game state
8. **get_high_score(player)** - Get a player's high score
9. **get_leaderboard()** - View the leaderboard (helper method)
10. **reset_game()** - Reset and start a fresh game
11. **add_points(player, amount)** - Add points to a player's account
12. **get_points(player)** - Query a player's point balance
13. **redeem_points(amount)** - Redeem points from account
14. **set_game_parameters(width, height)** - Configure board dimensions
15. **update_food_spawn_rate(rate)** - Adjust food spawn rate
16. **reset_leaderboard()** - Clear all high scores
17. **pause_game(player)** - Pause the current game
18. **resume_game(player)** - Resume a paused game
19. **send_score_to_leaderboard(score)** - Submit score (auto via end_game)
20. **receive_score_update(player, score)** - Update leaderboard (auto)

## 📋 Game Mechanics

- **Board**: Configurable size (default: 20x20)
- **Snake**: Starts with 3 segments in the center
- **Food**: Pseudo-randomly spawned
- **Scoring**: 10 points per food eaten
- **Collision**: Game ends on wall or self-collision
- **Points System**: Score converted to redeemable points on game end

## 🚀 Deployment Information

### Chain ID

```
443c867331e9b1347b68f2068580ccb92188cc588e89b358b5329cfae958c89d
```

### Application ID

```
509ecb8d1745da6ab7a559548f05fde413f3f5c4010cfc948709f58cc0dedbbe
```

### Deployment Date

November 5, 2025

## 🛠️ Building and Deploying

### Prerequisites

- Rust 1.86.0
- Linera CLI (v0.15.4)

### Build Process

1. **Fix ruzstd dependency** (Known issue with 0.8.2):

   ```bash
   cargo update -p ruzstd --precise 0.8.1
   ```

2. **Run tests**:

   ```bash
   cargo test --bin jeteeah_contract
   ```

3. **Start local Linera network**:

   ```bash
   linera net up &
   ```

4. **Set environment variables** (from linera net up output):

   ```bash
   export LINERA_WALLET="/tmp/.tmpXXXXXX/wallet_0.json"
   export LINERA_STORAGE="rocksdb:/tmp/.tmpXXXXXX/client_0.db"
   ```

5. **Deploy the contract**:
   ```bash
   linera project publish-and-create --json-argument "0"
   ```

## 🧪 Testing

The project includes comprehensive tests for all functions:

```bash
cargo test --bin jeteeah_contract
```

### Test Coverage

- ✅ Start game initialization
- ✅ Snake movement and direction changes
- ✅ Pause and resume functionality
- ✅ Game ending and point awards
- ✅ Game reset
- ✅ Points add and redeem
- ✅ Game parameters configuration
- ✅ Food spawn rate updates
- ✅ Wall collision detection

All 10 tests pass successfully!

## 📁 Project Structure

```
jeteeah/
├── Cargo.toml
├── rust-toolchain.toml
├── src/
│   ├── contract.rs      # Main contract logic
│   ├── service.rs       # GraphQL service
│   ├── state.rs         # Game state structures
│   └── lib.rs           # Public API and operations
├── tests/
│   └── single_chain.rs  # Integration tests
└── README.md
```

## 🎯 State Structure

### GameState

```rust
pub struct GameState {
    pub snake_body: Vec<Position>,
    pub direction: Direction,
    pub food_position: Position,
    pub score: u64,
    pub is_active: bool,
    pub is_paused: bool,
    pub width: i32,
    pub height: i32,
}
```

### Direction

```rust
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
}
```

## 🔧 Known Issues and Solutions

### ruzstd 0.8.2 Compilation Error

**Issue**: The `ruzstd` crate version 0.8.2 uses unstable Rust features not available in stable Rust 1.86.0.

**Solution**: Downgrade to version 0.8.1:

```bash
cargo update -p ruzstd --precise 0.8.1
```

## 📝 Operations

All operations are defined in `src/lib.rs` and can be called through the Linera GraphQL interface:

```rust
pub enum Operation {
    StartGame,
    MoveSnake { direction: Direction },
    EatFood,
    EndGame,
    ResetGame,
    AddPoints { amount: u64 },
    RedeemPoints { amount: u64 },
    SetGameParameters { width: i32, height: i32 },
    UpdateFoodSpawnRate { rate: u64 },
    ResetLeaderboard,
    PauseGame,
    ResumeGame,
}
```

## 📊 Query Interface

The service provides GraphQL queries for:

- `get_game_state(player)` - Current game state
- `get_high_score(player)` - Player's high score
- `get_points(player)` - Player's point balance

## 🎮 How to Play

1. **Start a game**: Call `StartGame` operation
2. **Move**: Call `MoveSnake` with direction (Up/Down/Left/Right)
3. **The snake**: Automatically grows when eating food
4. **Score points**: +10 for each food eaten
5. **Game over**: Collision with walls or self ends the game
6. **Points**: Earned points can be used for rewards

## 🏆 Leaderboard System

- High scores are automatically tracked per player
- Points are awarded equal to final score on game end
- Points can be redeemed for rewards (custom implementation)
- Leaderboard can be reset by authorized users

## 🤝 Contributing

This is a demonstration project showcasing Linera smart contract development with:

- State management
- Game logic implementation
- Comprehensive testing
- Proper error handling

## 📄 License

MIT License

## 🔗 Links

- [Linera Documentation](https://docs.linera.io/)
- [Linera Protocol](https://github.com/linera-io/linera-protocol)
- Chain Explorer: (Configure based on your network)

---

**Built with ❤️ on Linera**
