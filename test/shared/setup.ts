import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { KAP20Lending, KUBLending, YESToken } from "../../typechain";
import timeUtils from "../../utils/timeUtils";
import {
  deployYESToken,
  deployController,
  deployJumpRateModel,
  deployKAP20Lending,
  deployKUBLending,
  deployMarketImpl,
  deployMintableToken,
  deploySlidingWindowOracle,
  deploySwapFactory,
  deploySwapRouter,
  deployVault,
  deployKKUB,
  deployAdminProjectRouter,
  deployKYC,
  deployAdminProject,
  deployYesPriceOracle,
  deployAdmin,
  deployBorrowLimitOracle,
} from "./deployer";
import { poolConfig } from "./poolConfig";
import { addLiquidity, addLiquidityETH, getPair } from "./swap";

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export const deployTokens = async (
  committee: string,
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const kkub = await deployKKUB(committee, adminRouter, kyc, acceptedKycLevel);
  const kdai = await deployMintableToken(
    "Bitkub-Peg DAI",
    "KDAI",
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
  const kusdt = await deployMintableToken(
    "Bitkub-Peg USDT",
    "USDT",
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
  const kusdc = await deployMintableToken(
    "Bitkub-Peg USDC",
    "USDC",
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
  const keth = await deployMintableToken(
    "Bitkub-Peg ETH",
    "ETH",
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
  const kbtc = await deployMintableToken(
    "Bitkub-Peg BTC",
    "BTC",
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
  return {
    kkub,
    kdai,
    kusdt,
    kusdc,
    keth,
    kbtc,
  };
};

type TokenTypes = Awaited<ReturnType<typeof deployTokens>>;

export const deploySwap = async (kkubAddr: string) => {
  const [owner] = await ethers.getSigners();
  const swapFactory = await deploySwapFactory(owner.address);
  const swapRouter = await deploySwapRouter(swapFactory.address, kkubAddr);

  return {
    swapFactory,
    swapRouter,
  };
};

export const setupSwapPools = async (
  yes: YESToken,
  deployedTokens: TokenTypes
) => {
  const [owner] = await ethers.getSigners();

  const { kkub, ...tokens } = deployedTokens;

  const { swapRouter, swapFactory } = await deploySwap(kkub.address);

  const poolConfigArr = Object.entries(poolConfig);

  for (let i = 0; i < poolConfigArr.length; i++) {
    const [tokenPair, amounts] = poolConfigArr[i];
    const [token0Name] = tokenPair.split("_");

    if (token0Name === "KUB") {
      await addLiquidityETH(
        swapRouter.address,
        yes.address,
        amounts[1],
        amounts[0]
      );
    } else {
      const token = tokens[token0Name.toLowerCase()];
      const decimals = await token.decimals();
      const parsedAmount = parseUnits(amounts[0], decimals);
      await token.mint(owner.address, parsedAmount);
      await addLiquidity(
        swapRouter.address,
        token.address,
        yes.address,
        amounts[0],
        amounts[1]
      );
    }
  }

  const yesKUB = await getPair(swapFactory.address, yes.address, kkub.address);
  const yesKUSDT = await getPair(
    swapFactory.address,
    yes.address,
    tokens.kusdt.address
  );
  const yesKETH = await getPair(
    swapFactory.address,
    yes.address,
    tokens.keth.address
  );
  const yesKBTC = await getPair(
    swapFactory.address,
    yes.address,
    tokens.kbtc.address
  );
  const yesKUSDC = await getPair(
    swapFactory.address,
    yes.address,
    tokens.kusdc.address
  );

  return {
    ...tokens,
    kkub,
    yes,
    swapRouter,
    swapFactory,
    yesKUB,
    yesKUSDT,
    yesKETH,
    yesKBTC,
    yesKUSDC,
  };
};

export const setupOracle = async (
  yes: YESToken,
  deployedTokens: TokenTypes
) => {
  const contracts = await setupSwapPools(yes, deployedTokens);
  const { swapFactory, kkub, kdai, kusdt, kusdc, keth, kbtc } = contracts;

  const slidingWindowOracle = await deploySlidingWindowOracle(
    swapFactory.address
  );
  const priceOracle = await deployYesPriceOracle(
    slidingWindowOracle.address,
    kkub.address,
    yes.address
  );

  await timeUtils.increase(timeUtils.duration.minutes(2));

  await slidingWindowOracle
    .update(kkub.address, yes.address)
    .then((tx) => tx.wait());
  await slidingWindowOracle
    .update(kdai.address, yes.address)
    .then((tx) => tx.wait());
  await slidingWindowOracle
    .update(kusdt.address, yes.address)
    .then((tx) => tx.wait());
  await slidingWindowOracle
    .update(keth.address, yes.address)
    .then((tx) => tx.wait());
  await slidingWindowOracle
    .update(kbtc.address, yes.address)
    .then((tx) => tx.wait());
  await slidingWindowOracle
    .update(kusdc.address, yes.address)
    .then((tx) => tx.wait());

  return {
    ...contracts,
    slidingWindowOracle,
    priceOracle,
  };
};

export const deployLendingContracts = async (
  tokens: Awaited<ReturnType<typeof deployTokens>>,
  controllerAddr: string,
  interestModelAddr: string,
  committee: string,
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const poolConfigArr = Object.keys(poolConfig);

  let kubLending: KUBLending;
  let kap20Lendings: {
    kdaiLending: KAP20Lending;
    kusdtLending: KAP20Lending;
    kusdcLending: KAP20Lending;
    kethLending: KAP20Lending;
    kbtcLending: KAP20Lending;
  } = {
    kdaiLending: null,
    kethLending: null,
    kusdtLending: null,
    kusdcLending: null,
    kbtcLending: null,
  };

  const decimals = 18;
  const exchangeRate = "1";

  for (let i = 0; i < poolConfigArr.length; i++) {
    const tokenPair = poolConfigArr[i];
    const [token0Name] = tokenPair.split("_");

    if (token0Name === "KUB") {
      kubLending = await deployKUBLending(
        tokens.kkub.address,
        controllerAddr,
        interestModelAddr,
        `${token0Name} Lending Token`,
        `L-${token0Name}`,
        decimals,
        exchangeRate,
        committee,
        adminRouter,
        kyc,
        acceptedKycLevel
      );
    } else {
      kap20Lendings[`${token0Name.toLowerCase()}Lending`] =
        await deployKAP20Lending(
          tokens[token0Name.toLowerCase()].address,
          controllerAddr,
          interestModelAddr,
          `${token0Name} Lending Token`,
          `L-${token0Name}`,
          decimals,
          exchangeRate,
          committee,
          adminRouter,
          kyc,
          acceptedKycLevel
        );
    }
  }

  return {
    kubLending,
    ...kap20Lendings,
  };
};

export const deployYESSystem = async () => {
  const [owner, callHelper] = await ethers.getSigners();

  const projectName = "yuemmai";
  const adminSecret = "secret";

  const committee = owner.address;

  const acceptedKycLevel = 4;

  const admin = await deployAdmin(adminSecret);

  await admin.addSuperAdmin(owner.address);
  const kyc = await deployKYC(admin.address);

  const adminProject = await deployAdminProject(adminSecret);
  const adminRouter = await deployAdminProjectRouter(adminProject.address);

  await adminProject.addAdmin(owner.address, projectName);

  const borrowLimitOracle = await deployBorrowLimitOracle(adminProject.address);
  const controller = await deployController(adminProject.address, borrowLimitOracle.address);

  const totalSupply = "10000000";
  const totalAirdrop = "2500000";

  const yes = await deployYESToken(
    totalSupply,
    committee,
    adminRouter.address,
    kyc.address,
    acceptedKycLevel
  );

  const tokens = await deployTokens(
    committee,
    adminRouter.address,
    kyc.address,
    acceptedKycLevel
  );
  const { kkub, kbtc, keth, kusdc, kdai, kusdt, priceOracle, ...contracts } =
    await setupOracle(yes, tokens);

  const interest = await deployJumpRateModel();
  const marketImpl = await deployMarketImpl();

  const pendingRelease = timeUtils.duration.years(1);

  const yesVault = await deployVault(
    controller.address,
    yes.address,
    marketImpl.address,
    contracts.swapRouter.address,
    pendingRelease,
    adminRouter.address,
    kyc.address,
    acceptedKycLevel
  );

  const lendingContracts = await deployLendingContracts(
    { kkub, kbtc, keth, kusdc, kdai, kusdt },
    controller.address,
    interest.address,
    committee,
    adminRouter.address,
    kyc.address,
    acceptedKycLevel
  );

  await controller
    ._setCollateralFactor(parseEther("0.25"))
    .then((tx) => tx.wait());
  await controller
    ._setLiquidationIncentive(parseEther("1.08"))
    .then((tx) => tx.wait());
  await controller._setPriceOracle(priceOracle.address).then((tx) => tx.wait());
  await controller._setYESVault(yesVault.address).then((tx) => tx.wait());
  await controller
    ._supportMarket(lendingContracts.kubLending.address)
    .then((tx) => tx.wait());
  await controller
    ._supportMarket(lendingContracts.kbtcLending.address)
    .then((tx) => tx.wait());
  await controller
    ._supportMarket(lendingContracts.kusdtLending.address)
    .then((tx) => tx.wait());
  await controller
    ._supportMarket(lendingContracts.kusdcLending.address)
    .then((tx) => tx.wait());
  await controller
    ._supportMarket(lendingContracts.kdaiLending.address)
    .then((tx) => tx.wait());
  await controller
    ._supportMarket(lendingContracts.kdaiLending.address)
    .then((tx) => tx.wait());

  await yes.transfer(yesVault.address, parseEther(totalAirdrop));
  await yesVault._setMarketImpl(marketImpl.address).then((tx) => tx.wait());

  await adminProject.addSuperAdmin(yesVault.address, projectName);
  await adminProject.addSuperAdmin(callHelper.address, projectName);

  await adminProject.addSuperAdmin(
    lendingContracts.kubLending.address,
    projectName
  );
  await adminProject.addSuperAdmin(
    lendingContracts.kbtcLending.address,
    projectName
  );
  await adminProject.addSuperAdmin(
    lendingContracts.kethLending.address,
    projectName
  );
  await adminProject.addSuperAdmin(
    lendingContracts.kusdtLending.address,
    projectName
  );
  await adminProject.addSuperAdmin(
    lendingContracts.kdaiLending.address,
    projectName
  );
  await adminProject.addSuperAdmin(
    lendingContracts.kusdcLending.address,
    projectName
  );

  await priceOracle._addStableCoin(kusdc.address).then((tx) => tx.wait());
  await priceOracle._addStableCoin(kusdt.address).then((tx) => tx.wait());
  await priceOracle._addStableCoin(kdai.address).then((tx) => tx.wait());

  return {
    controller,
    yes,
    kkub,
    kbtc,
    keth,
    kusdc,
    kdai,
    kusdt,
    yesVault,
    interest,
    priceOracle,
    borrowLimitOracle,
    ...contracts,
    ...lendingContracts,
    kyc,
    adminProject,
  };
};

export type Contracts = Awaited<ReturnType<typeof deployYESSystem>>;
