import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat";
import {
  MintableToken__factory,
  YESController__factory,
  YESToken__factory,
  SlidingWindowOracle__factory,
  YESVault__factory,
  MarketImpl__factory,
  KKUB__factory,
  SwapFactory__factory,
  SwapRouter__factory,
  JumpRateModel__factory,
  AdminProjectRouter__factory,
  KYCBitkubChainV2__factory,
  Admin__factory,
  AdminProject__factory,
  KUBLending__factory,
  KAP20Lending__factory,
  YESPriceOracle__factory,
  BorrowLimitOracle__factory,
} from "../../typechain";
import timeUtils from "../../utils/timeUtils";

export const deployAdmin = async (key: string) => {
  const [root] = await ethers.getSigners();
  const Admin = (await ethers.getContractFactory("Admin")) as Admin__factory;
  return Admin.deploy(root.address, ethers.utils.formatBytes32String(key));
};

export const deployAdminProject = async (key: string) => {
  const [root] = await ethers.getSigners();
  const AdminProject = (await ethers.getContractFactory(
    "AdminProject"
  )) as AdminProject__factory;
  return AdminProject.deploy(
    root.address,
    ethers.utils.formatBytes32String(key)
  );
};

export const deployAdminProjectRouter = async (admin: string) => {
  const AdminProjectRouter = (await ethers.getContractFactory(
    "AdminProjectRouter"
  )) as AdminProjectRouter__factory;
  return AdminProjectRouter.deploy(admin);
};

export const deployKYC = async (admin: string) => {
  const KYCBitkubChainV2 = (await ethers.getContractFactory(
    "KYCBitkubChainV2"
  )) as KYCBitkubChainV2__factory;
  return KYCBitkubChainV2.deploy(admin);
};

export const deployBorrowLimitOracle = async (adminRouter: string) => {
  const BorrowLimitOracle = (await ethers.getContractFactory(
    "BorrowLimitOracle"
  )) as BorrowLimitOracle__factory;
  return BorrowLimitOracle.deploy(adminRouter);
};

export const deployController = async (adminRouter: string, borrowLimitOracle: string) => {
  const YESController = (await ethers.getContractFactory(
    "YESController"
  )) as YESController__factory;
  return YESController.deploy(adminRouter, borrowLimitOracle);
};

export const deployYESToken = async (
  totalSupply: string = "10000000",
  committee: string,
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const parsedSupply = ethers.utils.parseEther(totalSupply);
  const YESToken = (await ethers.getContractFactory(
    "YESToken"
  )) as YESToken__factory;
  return YESToken.deploy(
    parsedSupply,
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
};

export const deploySlidingWindowOracle = async (
  factoryAddr: string,
  windowSize = timeUtils.duration.hours(24),
  granularity = 2
) => {
  const SlidingWindowOracle = (await ethers.getContractFactory(
    "SlidingWindowOracle"
  )) as SlidingWindowOracle__factory;
  return SlidingWindowOracle.deploy(factoryAddr, windowSize, granularity);
};

export const deployYesPriceOracle = async (
  slidingWindowAddr: string,
  kkubAddr: string,
  yesAddr: string
) => {
  const YESPriceOracle = (await ethers.getContractFactory(
    "YESPriceOracle"
  )) as YESPriceOracle__factory;
  return YESPriceOracle.deploy(slidingWindowAddr, kkubAddr, yesAddr);
};

export const deployJumpRateModel = async (
  base = "0.207072885780685",
  multiplier = "0.0782174923623391",
  jumpMultiplier = "2.1209",
  kink = "0.8"
) => {
  const JumpRateModel = (await ethers.getContractFactory(
    "JumpRateModel"
  )) as JumpRateModel__factory;
  return JumpRateModel.deploy(
    ethers.utils.parseEther(base),
    ethers.utils.parseEther(multiplier),
    ethers.utils.parseEther(jumpMultiplier),
    ethers.utils.parseEther(kink)
  );
};

export const deployMarketImpl = async () => {
  const MarketImpl = (await ethers.getContractFactory(
    "MarketImpl"
  )) as MarketImpl__factory;
  return MarketImpl.deploy();
};

export const deployVault = async (
  controllerAddr: string,
  yesAddr: string,
  marketImplAddr: string,
  market: string,
  pendingRelease = timeUtils.duration.years(1),
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const YESVault = (await ethers.getContractFactory(
    "YESVault"
  )) as YESVault__factory;
  const releaseTime = (await timeUtils.latest()) + pendingRelease;

  return YESVault.deploy(
    controllerAddr,
    yesAddr,
    marketImplAddr,
    market,
    releaseTime,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
};

export const deployKAP20Lending = async (
  underlyingToken: string,
  controllerAddr: string,
  interestModelAddr: string,
  lTokenName: string,
  lTokenSymbol: string,
  lTokenDecimals = 18,
  exchangeRate = "1",
  committee: string,
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const KAP20Lending = (await ethers.getContractFactory(
    "KAP20Lending"
  )) as KAP20Lending__factory;
  return KAP20Lending.deploy(
    underlyingToken,
    controllerAddr,
    interestModelAddr,
    ethers.utils.parseEther(exchangeRate),
    lTokenName,
    lTokenSymbol,
    lTokenDecimals,
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
};

export const deployKUBLending = async (
  kkub: string,
  controllerAddr: string,
  interestModelAddr: string,
  lTokenName: string,
  lTokenSymbol: string,
  lTokenDecimals = 18,
  exchangeRate = "1",
  committee: string,
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const KUBLending = (await ethers.getContractFactory(
    "KUBLending"
  )) as KUBLending__factory;
  return KUBLending.deploy(
    kkub,
    controllerAddr,
    interestModelAddr,
    ethers.utils.parseEther(exchangeRate),
    lTokenName,
    lTokenSymbol,
    lTokenDecimals,
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
};

export const deployMintableToken = async (
  name: string,
  symbol: string,
  committee: string,
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const MintableToken = (await ethers.getContractFactory(
    "MintableToken"
  )) as MintableToken__factory;
  return MintableToken.deploy(
    name,
    symbol,
    committee,
    adminRouter,
    kyc,
    acceptedKycLevel
  );
};

export const deployKKUB = async (
  committee: string,
  adminRouter: string,
  kyc: string,
  acceptedKycLevel: number
) => {
  const KKUB = (await ethers.getContractFactory("KKUB")) as KKUB__factory;
  return KKUB.deploy(committee, adminRouter, kyc, acceptedKycLevel);
};

export const deploySwapFactory = async (feeTo: string) => {
  const SwapFactory = (await ethers.getContractFactory(
    "SwapFactory"
  )) as SwapFactory__factory;
  return SwapFactory.deploy(feeTo);
};

export const deploySwapRouter = async (
  factoryAddr: string,
  kkubAddr: string
) => {
  const SwapRouter = (await ethers.getContractFactory(
    "SwapRouter"
  )) as SwapRouter__factory;
  return SwapRouter.deploy(factoryAddr, kkubAddr);
};
