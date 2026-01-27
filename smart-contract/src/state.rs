use linera_sdk::{
    linera_base_types::AccountOwner,
    views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::Enum, Copy, PartialEq, Eq)]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
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

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct LeaderboardEntry {
    pub player: String,
    pub score: u64,
}

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct JeteeahState {
    pub value: RegisterView<u64>,
    pub games: MapView<AccountOwner, GameState>,
    pub high_scores: MapView<AccountOwner, u64>,
    pub points: MapView<AccountOwner, u64>,
    pub game_width: RegisterView<i32>,
    pub game_height: RegisterView<i32>,
    pub food_spawn_rate: RegisterView<u64>,
}
