export const ABI_STAKING = [
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "_gloopToken",
        type: "address"
      },
      {
        internalType: "contract IERC20",
        name: "_usdcToken",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "CannotModifyActiveLockPeriod",
    type: "error"
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error"
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientBalance",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientGloopTokensInGloopStakersWallet",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientRewardsToClaim",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientStakeAmount",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientStakedAmount",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientUSDCTokensInGloopStakersWallet",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidInputs",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidLockPeriod",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidTokenAddress",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidWalletAddress",
    type: "error"
  },
  {
    inputs: [],
    name: "NewStakingIsPaused",
    type: "error"
  },
  {
    inputs: [],
    name: "NoRewardsToClaim",
    type: "error"
  },
  {
    inputs: [],
    name: "OneInputMustNotBeZero",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "OwnableInvalidOwner",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error"
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error"
  },
  {
    inputs: [],
    name: "TokensStillLocked",
    type: "error"
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error"
  },
  {
    inputs: [],
    name: "UnstakeAllBeforeLocking",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "wallet",
        type: "address"
      }
    ],
    name: "GloopStakersWalletSet",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "duration",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "apr",
        type: "uint256"
      }
    ],
    name: "LockPeriodAPRAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "duration",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "apr",
        type: "uint256"
      }
    ],
    name: "LockPeriodAPRUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "duration",
        type: "uint256"
      }
    ],
    name: "LockPeriodActivated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "duration",
        type: "uint256"
      }
    ],
    name: "LockPeriodDeactivated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [],
    name: "NewStakingHasBeenPaused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [],
    name: "NewStakingHasResumed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "Paused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "gloopRewards",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "usdcRewards",
        type: "uint256"
      }
    ],
    name: "RewardsClaimed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "lockDuration",
        type: "uint256"
      }
    ],
    name: "Staked",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "usdcEmissionsPerSecond",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "distributionEnd",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalRewardSupply",
        type: "uint256"
      }
    ],
    name: "USDCRewardDataUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "Unpaused",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Unstaked",
    type: "event"
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_staker",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "forceUnstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address"
      }
    ],
    name: "getClaimableRewards",
    outputs: [
      {
        internalType: "uint256",
        name: "earnedGLOOP",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "earnedUSDC",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "claimableGLOOP",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "claimableUSDC",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address"
      }
    ],
    name: "getUserRewards",
    outputs: [
      {
        internalType: "uint256",
        name: "totalGLOOPRewards",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "totalUSDCRewards",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address"
      }
    ],
    name: "getUserStakedAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "gloopStakersWallet",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "gloopToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    name: "lockPeriods",
    outputs: [
      {
        internalType: "uint256",
        name: "apr",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool"
      },
      {
        internalType: "uint256",
        name: "activeStakers",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "newStakingPaused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_gloopRewards",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_usdcRewards",
        type: "uint256"
      }
    ],
    name: "partialClaimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_newStakingPaused",
        type: "bool"
      }
    ],
    name: "pauseNewStaking",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_wallet",
        type: "address"
      }
    ],
    name: "setGloopStakersWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_duration",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_apr",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "_isActive",
        type: "bool"
      }
    ],
    name: "setLockPeriods",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_usdcEmissionsPerSecond",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_distributionEnd",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_totalUSDCSupply",
        type: "uint256"
      }
    ],
    name: "setUSDCEmissionRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_lockPeriod",
        type: "uint256"
      }
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "stakers",
    outputs: [
      {
        internalType: "uint256",
        name: "amountStaked",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "usdcIndex",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "rewardsUSDC",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "rewardsGLOOP",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "lastUpdateTime",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "lockEndTime",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "lockDuration",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalStaked",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      }
    ],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "usdcParams",
    outputs: [
      {
        internalType: "uint256",
        name: "emissionsPerSecond",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "rewardIndex",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "lastUpdateTime",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "distributionEnd",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "totalRewardSupply",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "usdcToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];
