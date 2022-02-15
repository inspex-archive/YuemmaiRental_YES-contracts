import { alchemyApiKey, privateKeys } from './secrets.json';
import { ethers } from 'ethers';
import { HardhatUserConfig } from "hardhat/config";

import '@typechain/hardhat';
import "@nomiclabs/hardhat-waffle";
import '@nomiclabs/hardhat-ethers';
// import "solidity-coverage";
// import "hardhat-gas-reporter";
import "hardhat-contract-sizer";

export default {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
    ]
  },
  networks: {
    hardhat: {
      mining: {
        auto: true
      },
      accounts: privateKeys.map((sk) => ({ privateKey: sk, balance: ethers.utils.parseEther('100000000').toString() })),
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyApiKey}`,
      accounts: privateKeys,
    },
    kubchain_test_dev: {
      url: `https://rpc-testnet.bitkubchain.io`,
      accounts: [...privateKeys.slice(1), privateKeys[0]],
    },
    kubchain_test: {
      url: `https://rpc-testnet.bitkubchain.io`,
      accounts: privateKeys,
    },
    kubchain: {
      url: `https://rpc.bitkubchain.io`,
      accounts: privateKeys,
    }
  },
} as HardhatUserConfig;