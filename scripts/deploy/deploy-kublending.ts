import hre from "hardhat";
import { KUBLending__factory } from "../../typechain";
import addressUtils from '../../utils/addressUtils';

export const deployKUBLending = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);

  const KUBLending = await hre.ethers.getContractFactory("KUBLending") as KUBLending__factory;

  const exchangeRate = hre.ethers.utils.parseEther("1");
  const name = "KUB Lending Token";
  const symbol = "L-KUB"
  const decimals = 18;
  const acceptedKycLevel = 4;

  const kubLending = await KUBLending.deploy(
    addressList['KKUB'],
    addressList['YESController'],
    addressList['InterestRateModel'],
    exchangeRate,
    name,
    symbol,
    decimals,
    addressList['Committee'],
    addressList['AdminProjectRouter'],
    addressList['KYC'],
    acceptedKycLevel
  );

  console.log("Deploy KUBLending success: ", kubLending.address);

  await kubLending.deployTransaction.wait();

  await addressUtils.saveAddresses(hre.network.name, { KUBLending: kubLending.address });
}