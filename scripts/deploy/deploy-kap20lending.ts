import hre from "hardhat";
import { KAP20Lending__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";

export const deployKAP20Lending = async (underlyingSymbol: string) => {
  const addressList = await addressUtils.getAddressList(hre.network.name);

  const KAP20Lending = (await hre.ethers.getContractFactory(
    "KAP20Lending"
  )) as KAP20Lending__factory;

  const exchangeRate = hre.ethers.utils.parseEther("1");
  const name = `${underlyingSymbol} Lending Token`;
  const symbol = `L-${underlyingSymbol}`;
  const decimals = 18;
  const acceptedKycLevel = 0;

  const kap20Lending = await KAP20Lending.deploy(
    addressList[underlyingSymbol],
    addressList["YESController"],
    addressList["InterestRateModel"],
    exchangeRate,
    name,
    symbol,
    decimals,
    addressList["Committee"],
    addressList["AdminProjectRouter"],
    addressList["KYC"],
    acceptedKycLevel
  );

  console.log(`Deploy ${underlyingSymbol} Lending success: `, kap20Lending.address);

  await kap20Lending.deployTransaction.wait();

  await addressUtils.saveAddresses(hre.network.name, {
    [`${underlyingSymbol}Lending`]: kap20Lending.address,
  });
};
