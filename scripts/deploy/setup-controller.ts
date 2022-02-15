import hre from "hardhat";
import { YESController__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";

export const setupController = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const YESController = (await hre.ethers.getContractFactory(
    "YESController"
  )) as YESController__factory;
  const controller = await YESController.attach(addressList["YESController"]);

  await controller
    ._setCollateralFactor(hre.ethers.utils.parseEther("0.25"))
    .then((tx) => tx.wait());
  console.log(
    "Set collaeral factor to: ",
    await controller.collateralFactorMantissa().then((res) => res.toString())
  );

  await controller
    ._setLiquidationIncentive(hre.ethers.utils.parseEther("1.08"))
    .then((tx) => tx.wait());
  console.log(
    "Set liquidation incentive to: ",
    await controller
      .liquidationIncentiveMantissa()
      .then((res) => res.toString())
  );

  await controller
    ._setPriceOracle(addressList["YESPriceOracle"])
    .then((tx) => tx.wait());
  console.log(
    "Controller connects price oracle at: ",
    await controller.oracle()
  );

  await controller
    ._setYESVault(addressList["YESVault"])
    .then((tx) => tx.wait());
  console.log("Set YES vault to controller ", await controller.yesVault());

  await controller
    ._supportMarket(addressList["KUBLending"])
    .then((tx) => tx.wait());
  console.log("Add KUB to market");

  await controller
    ._supportMarket(addressList["KBTCLending"])
    .then((tx) => tx.wait());
  console.log("Add KBTC to market");

  await controller
    ._supportMarket(addressList["KETHLending"])
    .then((tx) => tx.wait());
  console.log("Add KETH to market");

  await controller
    ._supportMarket(addressList["KUSDTLending"])
    .then((tx) => tx.wait());
  console.log("Add KUSDT to market");

  await controller
    ._supportMarket(addressList["KUSDCLending"])
    .then((tx) => tx.wait());
  console.log("Add KUSDC to market");

  await controller
    ._supportMarket(addressList["KDAILending"])
    .then((tx) => tx.wait());
  console.log("Add KDAI to market");
};
