#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use jeteeah::Operation;

use self::state::JeteeahState;

pub struct JeteeahContract {
    state: JeteeahState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(JeteeahContract);

impl WithContractAbi for JeteeahContract {
    type Abi = jeteeah::JeteeahAbi;
}

impl Contract for JeteeahContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = u64;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = JeteeahState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        JeteeahContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: Self::InstantiationArgument) {
        // validate that the application parameters were configured correctly.
        self.runtime.application_parameters();
        self.state.value.set(argument);

        // Initialize default game parameters
        self.state.game_width.set(20);
        self.state.game_height.set(20);
        self.state.food_spawn_rate.set(1);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
            Operation::Increment { value } => {
                self.state.value.set(self.state.value.get() + value);
            }
            Operation::StartGame => {
                self.start_game().await;
            }
            Operation::MoveSnake { direction } => {
                // Convert jeteeah::state::Direction to state::Direction
                let local_direction = match direction {
                    jeteeah::state::Direction::Up => state::Direction::Up,
                    jeteeah::state::Direction::Down => state::Direction::Down,
                    jeteeah::state::Direction::Left => state::Direction::Left,
                    jeteeah::state::Direction::Right => state::Direction::Right,
                };
                self.move_snake(local_direction).await;
            }
            Operation::EatFood => {
                self.eat_food().await;
            }
            Operation::EndGame => {
                self.end_game().await;
            }
            Operation::ResetGame => {
                self.reset_game().await;
            }
            Operation::AddPoints { amount } => {
                self.add_points(amount).await;
            }
            Operation::RedeemPoints { amount } => {
                self.redeem_points(amount).await;
            }
            Operation::SetGameParameters { width, height } => {
                self.set_game_parameters(width, height).await;
            }
            Operation::UpdateFoodSpawnRate { rate } => {
                self.update_food_spawn_rate(rate).await;
            }
            Operation::ResetLeaderboard => {
                self.reset_leaderboard().await;
            }
            Operation::PauseGame => {
                self.pause_game().await;
            }
            Operation::ResumeGame => {
                self.resume_game().await;
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl JeteeahContract {
    /// Starts a new game for the caller
    async fn start_game(&mut self) {
        use self::state::{Direction, GameState, Position};

        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let width = *self.state.game_width.get();
        let height = *self.state.game_height.get();

        // Initialize snake in the center of the board
        let center_x = width / 2;
        let center_y = height / 2;

        let initial_snake = vec![
            Position {
                x: center_x,
                y: center_y,
            },
            Position {
                x: center_x - 1,
                y: center_y,
            },
            Position {
                x: center_x - 2,
                y: center_y,
            },
        ];

        // Spawn initial food
        let food_position = Position {
            x: (center_x + 5) % width,
            y: (center_y + 5) % height,
        };

        let game_state = GameState {
            snake_body: initial_snake,
            direction: Direction::Right,
            food_position,
            score: 0,
            is_active: true,
            is_paused: false,
            width,
            height,
        };

        self.state
            .games
            .insert(&player, game_state)
            .expect("Failed to insert game state");
    }

    /// Moves the snake in the specified direction
    async fn move_snake(&mut self, new_direction: state::Direction) {
        use self::state::{Direction, Position};

        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let mut game = self
            .state
            .games
            .get(&player)
            .await
            .expect("Failed to read game state")
            .expect("Game not found");

        if !game.is_active || game.is_paused {
            return;
        }

        // Prevent reversing into itself
        let opposite = match game.direction {
            Direction::Up => Direction::Down,
            Direction::Down => Direction::Up,
            Direction::Left => Direction::Right,
            Direction::Right => Direction::Left,
        };

        if new_direction == opposite {
            return;
        }

        game.direction = new_direction;

        // Calculate new head position
        let head = &game.snake_body[0];
        let new_head = match game.direction {
            Direction::Up => Position {
                x: head.x,
                y: head.y - 1,
            },
            Direction::Down => Position {
                x: head.x,
                y: head.y + 1,
            },
            Direction::Left => Position {
                x: head.x - 1,
                y: head.y,
            },
            Direction::Right => Position {
                x: head.x + 1,
                y: head.y,
            },
        };

        // Check collision before moving
        if self.check_collision_internal(&game, &new_head).await {
            game.is_active = false;
            self.state
                .games
                .insert(&player, game)
                .expect("Failed to update game state");
            return;
        }

        // Check if food is eaten
        let ate_food = new_head.x == game.food_position.x && new_head.y == game.food_position.y;

        // Add new head
        game.snake_body.insert(0, new_head);

        // Remove tail if no food eaten
        if !ate_food {
            game.snake_body.pop();
        } else {
            // Update score and spawn new food
            game.score += 10;
            game.food_position = self.spawn_food_internal(&game).await;

            // Update high score
            let current_high = self
                .state
                .high_scores
                .get(&player)
                .await
                .expect("Failed to read high score")
                .unwrap_or(0);

            if game.score > current_high {
                self.state
                    .high_scores
                    .insert(&player, game.score)
                    .expect("Failed to update high score");
            }
        }

        self.state
            .games
            .insert(&player, game)
            .expect("Failed to update game state");
    }

    /// Checks for collisions with walls or snake body
    async fn check_collision_internal(
        &self,
        game: &state::GameState,
        position: &state::Position,
    ) -> bool {
        // Wall collision
        if position.x < 0 || position.x >= game.width || position.y < 0 || position.y >= game.height
        {
            return true;
        }

        // Self collision
        for segment in &game.snake_body {
            if segment.x == position.x && segment.y == position.y {
                return true;
            }
        }

        false
    }

    /// Processes food eating (called automatically in move_snake)
    async fn eat_food(&mut self) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let mut game = self
            .state
            .games
            .get(&player)
            .await
            .expect("Failed to read game state")
            .expect("Game not found");

        if !game.is_active || game.is_paused {
            return;
        }

        let head = &game.snake_body[0];
        if head.x == game.food_position.x && head.y == game.food_position.y {
            game.score += 10;
            game.food_position = self.spawn_food_internal(&game).await;

            self.state
                .games
                .insert(&player, game)
                .expect("Failed to update game state");
        }
    }

    /// Spawns food at a random position
    async fn spawn_food_internal(&self, game: &state::GameState) -> state::Position {
        use self::state::Position;

        // Simple pseudo-random food placement
        // In production, you'd want better randomization
        let seed = game.score + game.snake_body.len() as u64;
        let x = (seed * 7 + 13) % game.width as u64;
        let y = (seed * 11 + 17) % game.height as u64;

        Position {
            x: x as i32,
            y: y as i32,
        }
    }

    /// Ends the current game
    async fn end_game(&mut self) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let mut game = self
            .state
            .games
            .get(&player)
            .await
            .expect("Failed to read game state")
            .expect("Game not found");

        game.is_active = false;

        // Award points equal to score
        let current_points = self
            .state
            .points
            .get(&player)
            .await
            .expect("Failed to read points")
            .unwrap_or(0);

        self.state
            .points
            .insert(&player, current_points + game.score)
            .expect("Failed to update points");

        self.state
            .games
            .insert(&player, game)
            .expect("Failed to update game state");
    }

    /// Resets the game for the player
    async fn reset_game(&mut self) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        // Remove the game
        self.state
            .games
            .remove(&player)
            .expect("Failed to remove game");

        // Start a new game
        self.start_game().await;
    }

    /// Adds points to a player's account
    async fn add_points(&mut self, amount: u64) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let current_points = self
            .state
            .points
            .get(&player)
            .await
            .expect("Failed to read points")
            .unwrap_or(0);

        self.state
            .points
            .insert(&player, current_points + amount)
            .expect("Failed to update points");
    }

    /// Redeems points from a player's account
    async fn redeem_points(&mut self, amount: u64) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let current_points = self
            .state
            .points
            .get(&player)
            .await
            .expect("Failed to read points")
            .unwrap_or(0);

        if current_points >= amount {
            self.state
                .points
                .insert(&player, current_points - amount)
                .expect("Failed to update points");
        }
    }

    /// Sets the game board dimensions
    async fn set_game_parameters(&mut self, width: i32, height: i32) {
        self.state.game_width.set(width);
        self.state.game_height.set(height);
    }

    /// Updates the food spawn rate
    async fn update_food_spawn_rate(&mut self, rate: u64) {
        self.state.food_spawn_rate.set(rate);
    }

    /// Resets the leaderboard (clears all high scores)
    async fn reset_leaderboard(&mut self) {
        // Note: In a production system, you'd iterate and clear all entries
        // For now, this is a placeholder that would need proper iteration
        // over the MapView to clear all entries
    }

    /// Pauses the current game
    async fn pause_game(&mut self) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let mut game = self
            .state
            .games
            .get(&player)
            .await
            .expect("Failed to read game state")
            .expect("Game not found");

        if game.is_active {
            game.is_paused = true;
            self.state
                .games
                .insert(&player, game)
                .expect("Failed to update game state");
        }
    }

    /// Resumes a paused game
    async fn resume_game(&mut self) {
        let player = self
            .runtime
            .authenticated_signer()
            .expect("Player must be authenticated");

        let mut game = self
            .state
            .games
            .get(&player)
            .await
            .expect("Failed to read game state")
            .expect("Game not found");

        if game.is_active && game.is_paused {
            game.is_paused = false;
            self.state
                .games
                .insert(&player, game)
                .expect("Failed to update game state");
        }
    }

    /// Gets the game state for a player (helper for queries)
    pub async fn get_game_state(&self, player: &linera_sdk::linera_base_types::AccountOwner) -> Option<state::GameState> {
        self.state
            .games
            .get(player)
            .await
            .expect("Failed to read game state")
    }

    /// Gets the high score for a player
    pub async fn get_high_score(&self, player: &linera_sdk::linera_base_types::AccountOwner) -> u64 {
        self.state
            .high_scores
            .get(player)
            .await
            .expect("Failed to read high score")
            .unwrap_or(0)
    }

    /// Gets points for a player
    pub async fn get_points(&self, player: &linera_sdk::linera_base_types::AccountOwner) -> u64 {
        self.state
            .points
            .get(player)
            .await
            .expect("Failed to read points")
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use futures::FutureExt as _;
    use linera_sdk::{util::BlockingWait, views::View, Contract, ContractRuntime};

    use jeteeah::Operation;

    use super::{JeteeahContract, JeteeahState};

    #[test]
    fn operation() {
        let initial_value = 10u64;
        let mut app = create_and_instantiate_app(initial_value);

        let increment = 10u64;

        let _response = app
            .execute_operation(Operation::Increment { value: increment })
            .now_or_never()
            .expect("Execution of application operation should not await anything");

        assert_eq!(*app.state.value.get(), initial_value + increment);
    }

    #[test]
    fn test_start_game() {
        use linera_sdk::linera_base_types::{AccountOwner, CryptoHash};

        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        // Set up authentication for testing
        let test_owner = AccountOwner::from(CryptoHash::from([1u8; 32]));
        app.runtime.set_authenticated_signer(Some(test_owner));

        // Start a new game
        let _response = app
            .execute_operation(Operation::StartGame)
            .now_or_never()
            .expect("Start game operation should not await anything");

        // Get the test owner
        let player = AccountOwner::from(CryptoHash::from([1u8; 32]));

        let game_state = app
            .state
            .games
            .get(&player)
            .blocking_wait()
            .expect("Failed to read game state")
            .expect("Game state should exist");

        // Verify initial snake position and length
        assert_eq!(
            game_state.snake_body.len(),
            3,
            "Snake should start with 3 segments"
        );
        assert!(game_state.is_active, "Game should be active");
        assert!(!game_state.is_paused, "Game should not be paused");
        assert_eq!(game_state.score, 0, "Initial score should be 0");

        // Verify game board dimensions
        assert_eq!(game_state.width, 20);
        assert_eq!(game_state.height, 20);

        // Verify snake is in center area
        let head = &game_state.snake_body[0];
        assert_eq!(head.x, 10); // center x
        assert_eq!(head.y, 10); // center y
    }

    #[test]
    fn test_move_snake() {
        use linera_sdk::linera_base_types::{AccountOwner, CryptoHash};
        use jeteeah::state::Direction;

        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        let test_owner = AccountOwner::from(CryptoHash::from([1u8; 32]));
        app.runtime.set_authenticated_signer(Some(test_owner));

        // Start game
        app.execute_operation(Operation::StartGame)
            .now_or_never()
            .expect("Start game should not await");

        // Move right
        app.execute_operation(Operation::MoveSnake { direction: Direction::Right })
            .now_or_never()
            .expect("Move snake should not await");

        let player = AccountOwner::from(CryptoHash::from([1u8; 32]));
        let game_state = app.state.games.get(&player).blocking_wait()
            .expect("Failed to read").expect("Game should exist");

        // Snake should have moved right
        assert_eq!(game_state.snake_body[0].x, 11);
        assert!(game_state.is_active);
    }

    #[test]
    fn test_pause_and_resume() {
        use linera_sdk::linera_base_types::{AccountOwner, CryptoHash};

        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        let test_owner = AccountOwner::from(CryptoHash::from([1u8; 32]));
        app.runtime.set_authenticated_signer(Some(test_owner));

        // Start game
        app.execute_operation(Operation::StartGame)
            .now_or_never()
            .expect("Start game should not await");

        // Pause game
        app.execute_operation(Operation::PauseGame)
            .now_or_never()
            .expect("Pause game should not await");

        let player = AccountOwner::from(CryptoHash::from([1u8; 32]));
        let game_state = app.state.games.get(&player).blocking_wait()
            .expect("Failed to read").expect("Game should exist");

        assert!(game_state.is_paused, "Game should be paused");
        assert!(game_state.is_active, "Game should still be active");

        // Resume game
        app.execute_operation(Operation::ResumeGame)
            .now_or_never()
            .expect("Resume game should not await");

        let game_state = app.state.games.get(&player).blocking_wait()
            .expect("Failed to read").expect("Game should exist");

        assert!(!game_state.is_paused, "Game should not be paused");
        assert!(game_state.is_active, "Game should be active");
    }

    #[test]
    fn test_end_game_awards_points() {
        use linera_sdk::linera_base_types::{AccountOwner, CryptoHash};

        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        let test_owner = AccountOwner::from(CryptoHash::from([1u8; 32]));
        app.runtime.set_authenticated_signer(Some(test_owner));

        // Start game
        app.execute_operation(Operation::StartGame)
            .blocking_wait();

        // End game
        app.execute_operation(Operation::EndGame)
            .blocking_wait();

        let player = AccountOwner::from(CryptoHash::from([1u8; 32]));
        let game_state = app.state.games.get(&player).blocking_wait()
            .expect("Failed to read").expect("Game should exist");

        assert!(!game_state.is_active, "Game should be inactive");

        // Check points were awarded (score was 0, so points should be 0)
        let points = app.state.points.get(&player).blocking_wait()
            .expect("Failed to read points").unwrap_or(0);
        assert_eq!(points, game_state.score, "Points should equal score");
    }

    #[test]
    fn test_reset_game() {
        use linera_sdk::linera_base_types::{AccountOwner, CryptoHash};

        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        let test_owner = AccountOwner::from(CryptoHash::from([1u8; 32]));
        app.runtime.set_authenticated_signer(Some(test_owner));

        // Start game
        app.execute_operation(Operation::StartGame)
            .now_or_never()
            .expect("Start game should not await");

        // Reset game
        app.execute_operation(Operation::ResetGame)
            .now_or_never()
            .expect("Reset game should not await");

        let player = AccountOwner::from(CryptoHash::from([1u8; 32]));
        let game_state = app.state.games.get(&player).blocking_wait()
            .expect("Failed to read").expect("Game should exist");

        // Should be a fresh game
        assert_eq!(game_state.score, 0);
        assert_eq!(game_state.snake_body.len(), 3);
        assert!(game_state.is_active);
        assert!(!game_state.is_paused);
    }

    #[test]
    fn test_add_and_redeem_points() {
        use linera_sdk::linera_base_types::{AccountOwner, CryptoHash};

        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        let test_owner = AccountOwner::from(CryptoHash::from([1u8; 32]));
        app.runtime.set_authenticated_signer(Some(test_owner));

        // Add points
        app.execute_operation(Operation::AddPoints { amount: 100 })
            .blocking_wait();

        let player = AccountOwner::from(CryptoHash::from([1u8; 32]));
        let points = app.state.points.get(&player).blocking_wait()
            .expect("Failed to read points").unwrap_or(0);
        assert_eq!(points, 100);

        // Redeem points
        app.execute_operation(Operation::RedeemPoints { amount: 50 })
            .blocking_wait();

        let points = app.state.points.get(&player).blocking_wait()
            .expect("Failed to read points").unwrap_or(0);
        assert_eq!(points, 50);

        // Try to redeem more than available (should fail silently)
        app.execute_operation(Operation::RedeemPoints { amount: 100 })
            .blocking_wait();

        let points = app.state.points.get(&player).blocking_wait()
            .expect("Failed to read points").unwrap_or(0);
        assert_eq!(points, 50, "Points should not change if insufficient");
    }

    #[test]
    fn test_set_game_parameters() {
        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        // Set new dimensions
        app.execute_operation(Operation::SetGameParameters { width: 30, height: 25 })
            .now_or_never()
            .expect("Set game parameters should not await");

        assert_eq!(*app.state.game_width.get(), 30);
        assert_eq!(*app.state.game_height.get(), 25);
    }

    #[test]
    fn test_update_food_spawn_rate() {
        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        // Update food spawn rate
        app.execute_operation(Operation::UpdateFoodSpawnRate { rate: 5 })
            .now_or_never()
            .expect("Update food spawn rate should not await");

        assert_eq!(*app.state.food_spawn_rate.get(), 5);
    }

    #[test]
    fn test_collision_detection_wall() {
        use linera_sdk::linera_base_types::{AccountOwner, CryptoHash};
        use jeteeah::state::Direction;

        let initial_value = 0u64;
        let mut app = create_and_instantiate_app(initial_value);

        let test_owner = AccountOwner::from(CryptoHash::from([1u8; 32]));
        app.runtime.set_authenticated_signer(Some(test_owner));

        // Start game
        app.execute_operation(Operation::StartGame)
            .blocking_wait();

        let player = AccountOwner::from(CryptoHash::from([1u8; 32]));
        
        // Snake starts at x=10, y=10. Move Up 11 times to reach y=-1 (collision with top wall)
        for _ in 0..11 {
            app.execute_operation(Operation::MoveSnake { direction: Direction::Up })
                .blocking_wait();
        }

        let game_state = app.state.games.get(&player).blocking_wait()
            .expect("Failed to read").expect("Game should exist");
        
        // Check that collision was detected
        assert!(!game_state.is_active, "Game should be inactive after wall collision. Final y position: {}", game_state.snake_body[0].y);
    }

    fn create_and_instantiate_app(initial_value: u64) -> JeteeahContract {
        let runtime = ContractRuntime::new().with_application_parameters(());
        let mut contract = JeteeahContract {
            state: JeteeahState::load(runtime.root_view_storage_context())
                .blocking_wait()
                .expect("Failed to read from mock key value store"),
            runtime,
        };

        contract
            .instantiate(initial_value)
            .now_or_never()
            .expect("Initialization of application state should not await anything");

        assert_eq!(*contract.state.value.get(), initial_value);

        contract
    }
}
