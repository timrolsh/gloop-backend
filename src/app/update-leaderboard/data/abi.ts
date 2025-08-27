/*
The ABI for the Gm Points contract. Deployed contract address on arbitrum: 0xA2751916B54Ee853B35c9a558bd9cA7D8dB5Bd40
*/
export const ABI = [
  {
    inputs: [{internalType: "address", name: "_poolContract", type: "address"}],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {inputs: [], name: "CannotChangeDuringProgram", type: "error"},
  {inputs: [], name: "EnforcedPause", type: "error"},
  {inputs: [], name: "ExpectedPause", type: "error"},
  {inputs: [], name: "FunctionNotActiveYet", type: "error"},
  {inputs: [], name: "NoPointsToClaim", type: "error"},
  {inputs: [], name: "OnlyPoolCanCall", type: "error"},
  {inputs: [], name: "PointProgramIsOver", type: "error"},
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: "address", name: "user", type: "address"},
      {indexed: true, internalType: "contract Authority", name: "newAuthority", type: "address"}
    ],
    name: "AuthorityUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: "address", name: "user", type: "address"},
      {indexed: true, internalType: "uint256", name: "totalEarnedPoints", type: "uint256"}
    ],
    name: "Claim",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {indexed: true, internalType: "address", name: "user", type: "address"},
      {indexed: true, internalType: "address", name: "newOwner", type: "address"}
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [{indexed: false, internalType: "address", name: "account", type: "address"}],
    name: "Paused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [{indexed: false, internalType: "address", name: "account", type: "address"}],
    name: "Unpaused",
    type: "event"
  },
  {
    inputs: [],
    name: "MIN_DEPOSIT_AMOUNT",
    outputs: [{internalType: "uint256", name: "", type: "uint256"}],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "authority",
    outputs: [{internalType: "contract Authority", name: "", type: "address"}],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {internalType: "address", name: "user", type: "address"},
      {internalType: "uint8", name: "activity", type: "uint8"},
      {internalType: "uint256", name: "updatedBalance", type: "uint256"}
    ],
    name: "calculateFloatingPoints",
    outputs: [
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"}
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "claimPoints",
    outputs: [{internalType: "uint256", name: "", type: "uint256"}],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getTotalProgramStats",
    outputs: [
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"}
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{internalType: "address", name: "user", type: "address"}],
    name: "getUserData",
    outputs: [
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"}
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{internalType: "address", name: "", type: "address"}],
    stateMutability: "view",
    type: "function"
  },
  {inputs: [], name: "pause", outputs: [], stateMutability: "nonpayable", type: "function"},
  {
    inputs: [],
    name: "paused",
    outputs: [{internalType: "bool", name: "", type: "bool"}],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "pointParams",
    outputs: [
      {internalType: "uint256", name: "lendingUSDCPPD", type: "uint256"},
      {internalType: "uint256", name: "borrowingUSDCPPD", type: "uint256"}
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "pointsEndTime",
    outputs: [{internalType: "uint256", name: "", type: "uint256"}],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "pointsStartTime",
    outputs: [{internalType: "uint256", name: "", type: "uint256"}],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "poolContract",
    outputs: [{internalType: "contract LendingPool", name: "", type: "address"}],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "programStats",
    outputs: [
      {internalType: "uint256", name: "totalNumUsers", type: "uint256"},
      {internalType: "uint256", name: "totalLendingPoints", type: "uint256"},
      {internalType: "uint256", name: "totalBorrowingPoints", type: "uint256"}
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{internalType: "contract Authority", name: "newAuthority", type: "address"}],
    name: "setAuthority",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {internalType: "uint256", name: "_pointsStartTime", type: "uint256"},
      {internalType: "uint256", name: "_pointsEndTime", type: "uint256"},
      {internalType: "uint256", name: "_lendingUSDCPPD", type: "uint256"},
      {internalType: "uint256", name: "_borrowingUSDCPPD", type: "uint256"}
    ],
    name: "setPointsParameters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{internalType: "address", name: "newOwner", type: "address"}],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {inputs: [], name: "unpause", outputs: [], stateMutability: "nonpayable", type: "function"},
  {
    inputs: [
      {internalType: "address", name: "user", type: "address"},
      {internalType: "enum GMPoints.PoolActivity", name: "activity", type: "uint8"},
      {internalType: "uint256", name: "existingBalance", type: "uint256"}
    ],
    name: "updatePoints",
    outputs: [
      {internalType: "uint256", name: "", type: "uint256"},
      {internalType: "uint256", name: "", type: "uint256"}
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "usdcToken",
    outputs: [{internalType: "contract ERC20", name: "", type: "address"}],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{internalType: "address", name: "", type: "address"}],
    name: "userCache",
    outputs: [
      {internalType: "uint256", name: "lastUpdateTime", type: "uint256"},
      {internalType: "uint256", name: "existingLendBalance", type: "uint256"},
      {internalType: "uint256", name: "existingBorrowBalance", type: "uint256"},
      {internalType: "uint256", name: "lendingUSDCPoints", type: "uint256"},
      {internalType: "uint256", name: "borrowingUSDCPoints", type: "uint256"},
      {internalType: "uint256", name: "totalEarnedPoints", type: "uint256"},
      {internalType: "uint256", name: "claimedPoints", type: "uint256"}
    ],
    stateMutability: "view",
    type: "function"
  }
];
