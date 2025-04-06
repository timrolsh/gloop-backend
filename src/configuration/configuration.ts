export const configuration = () => ({
    app: {
        port: parseInt(process.env.APP_PORT, 10),
        name: process.env.APP_NAME,
        description: process.env.APP_DESCRIPTION,
        version: process.env.APP_VERSION,
        isProduction: process.env.APP_IS_PRODUCTION === "true",
    },
    database: {
        databaseHost: process.env.DATABASE_HOST,
        databasePort: parseInt(process.env.DATABASE_PORT),
        databaseUser: process.env.DATABASE_USER,
        databasePassword: process.env.DATABASE_PASSWORD,
        databaseName: process.env.DATABASE_NAME,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        accessTokenTime: process.env.JWT_ACCESS_TOKEN_TIME,
        refreshTokenTime: process.env.JWT_REFRESH_TOKEN_TIME,
    },
    auth: {
        greeting: "Hi, How Are you? Welcome to the Gloop",
    },
    crypto: {
        network: process.env.NETWORK,
        contractAddress: process.env.NETWORK === "testnet" ? process.env.CONTRACT_ADDRESS_TESTNET : process.env.CONTRACT_ADDRESS_MAINNET,
        rpcUrl: process.env.NETWORK === "testnet" ? process.env.TESTNET_RPC_URL : process.env.MAINNET_RPC_URL,
        rpcSocket: process.env.NETWORK === "testnet" ? process.env.TESTNET_RPC_SOCKET : process.env.MAINNET_RPC_SOCKET,
        gmPointContactAddress: process.env.NETWORK === "testnet" ? process.env.GM_POINTS_CONTACT_ADDRESS_TESTNET : process.env.GM_POINTS_CONTACT_ADDRESS_MAINNET,
        gmBtc: process.env.NETWORK === "testnet" ? process.env.GM_BTC_TESTNET : process.env.GM_BTC_MAINNET,
        gmETH: process.env.NETWORK === "testnet" ? process.env.GM_ETH_TESTNET : process.env.GM_ETH_MAINNET,
        gmSOL: process.env.NETWORK === "testnet" ? process.env.GM_SOL_TESTNET : process.env.GM_SOL_MAINNET,
        usdc: process.env.NETWORK === "testnet" ? process.env.USDC_TESTNET : process.env.USDC_MAINNET,
    },
});
