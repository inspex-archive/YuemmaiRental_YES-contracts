import hre from "hardhat";
import { MarketImpl__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";

export const deployMarketImpl = async () => {
  const MarketImpl = await hre.ethers.getContractFactory("MarketImpl") as MarketImpl__factory;

  const marketImpl = await MarketImpl.deploy();
  console.log("Deploy Market Impl success: ", marketImpl.address);

  await marketImpl.deployTransaction.wait();

  await addressUtils.saveAddresses(hre.network.name, { MarketImpl: marketImpl.address });
}