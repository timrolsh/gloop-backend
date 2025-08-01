export const ABI_REFERRAL = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_poolContract",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "MIN_DEPOSIT_AMOUNT",
    inputs: [],
    outputs: [{name: "", type: "uint256", internalType: "uint256"}],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "authority",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract Authority"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "calculateFloatingPoints",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "activity",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "updatedBalance",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"}
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "claimPoints",
    inputs: [],
    outputs: [{name: "", type: "uint256", internalType: "uint256"}],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getTotalProgramStats",
    inputs: [],
    outputs: [
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"}
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getUserData",
    inputs: [{name: "user", type: "address", internalType: "address"}],
    outputs: [
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"}
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{name: "", type: "address", internalType: "address"}],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{name: "", type: "bool", internalType: "bool"}],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pointParams",
    inputs: [],
    outputs: [
      {
        name: "lendingUSDCPPD",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "borrowingUSDCPPD",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pointsEndTime",
    inputs: [],
    outputs: [{name: "", type: "uint256", internalType: "uint256"}],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "pointsStartTime",
    inputs: [],
    outputs: [{name: "", type: "uint256", internalType: "uint256"}],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "poolContract",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract LendingPool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "programStats",
    inputs: [],
    outputs: [
      {
        name: "totalNumUsers",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "totalLendingPoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "totalBorrowingPoints",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "setAuthority",
    inputs: [
      {
        name: "newAuthority",
        type: "address",
        internalType: "contract Authority"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setPointsParameters",
    inputs: [
      {
        name: "_pointsStartTime",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_pointsEndTime",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_lendingUSDCPPD",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_borrowingUSDCPPD",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "updatePoints",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address"
      },
      {
        name: "activity",
        type: "uint8",
        internalType: "enum GMPoints.PoolActivity"
      },
      {
        name: "existingBalance",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {name: "", type: "uint256", internalType: "uint256"},
      {name: "", type: "uint256", internalType: "uint256"}
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "usdcToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract ERC20"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "userCache",
    inputs: [{name: "", type: "address", internalType: "address"}],
    outputs: [
      {
        name: "lastUpdateTime",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "existingLendBalance",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "existingBorrowBalance",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "lendingUSDCPoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "borrowingUSDCPoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "totalEarnedPoints",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "claimedPoints",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "AuthorityUpdated",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newAuthority",
        type: "address",
        indexed: true,
        internalType: "contract Authority"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Claim",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "totalEarnedPoints",
        type: "uint256",
        indexed: true,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Paused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Unpaused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {type: "error", name: "CannotChangeDuringProgram", inputs: []},
  {type: "error", name: "EnforcedPause", inputs: []},
  {type: "error", name: "ExpectedPause", inputs: []},
  {type: "error", name: "FunctionNotActiveYet", inputs: []},
  {type: "error", name: "NoPointsToClaim", inputs: []},
  {type: "error", name: "OnlyPoolCanCall", inputs: []},
  {type: "error", name: "PointProgramIsOver", inputs: []}
];
