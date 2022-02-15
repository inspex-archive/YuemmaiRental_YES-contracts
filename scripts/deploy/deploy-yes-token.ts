import { parseEther } from "@ethersproject/units";
import hre, { ethers } from "hardhat";
import { YESToken__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";

export const deployYESToken = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);

  const totalSupply = hre.ethers.utils.parseEther("10000000");

  // const committee = '0x053Ef442E2cC661b1D09E9E38b13Ed0e9FB91C13'; // mainnet
  const acceptedKycLevel = 4;

  const YESToken = (await hre.ethers.getContractFactory(
    "YESToken"
  )) as YESToken__factory;
  const yesToken = await YESToken.deploy(
    totalSupply,
    addressList["Committee"],
    addressList["AdminProjectRouter"],
    addressList["KYC"],
    acceptedKycLevel
  );
  await yesToken.deployTransaction.wait().then((res) => res.transactionHash);

  console.log("YES Token: ", yesToken.address);

  await addressUtils.saveAddresses(hre.network.name, { YES: yesToken.address });
};
