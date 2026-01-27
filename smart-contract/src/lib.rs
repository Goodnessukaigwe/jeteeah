use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub mod state;

pub struct JeteeahAbi;

impl ContractAbi for JeteeahAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for JeteeahAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    Increment { value: u64 },
    StartGame,
    MoveSnake { direction: state::Direction },
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
