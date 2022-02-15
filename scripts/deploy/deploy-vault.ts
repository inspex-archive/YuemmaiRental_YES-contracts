import hre from "hardhat";
import { YESVault__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";
import time from "../../utils/timeUtils";

export const deployVault = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);

  const YESVault = await hre.ethers.getContractFactory("YESVault") as YESVault__factory;

  // const releaseTime = await time.latest() + time.duration.years(1);
  const releaseTime = Math.floor(new Date('2022-01-21 00:00').valueOf() / 1000);

  const acceptedKycLevel = 4;

  const yesVault = await YESVault.deploy(
    addressList['YESController'],
    addressList['YES'],
    addressList['MarketImpl'],
    addressList['SwapRouter'],
    releaseTime,
    addressList['AdminProjectRouter'],
    addressList["KYC"],
    acceptedKycLevel,
  );

  await yesVault.deployTransaction.wait();
  console.log("Deploy YES Vault success: ", yesVault.address);

  await addressUtils.saveAddresses(hre.network.name, { YESVault: yesVault.address });
}