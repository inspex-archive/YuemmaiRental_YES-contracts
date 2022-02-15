import hre from "hardhat";
import { BorrowLimitOracle__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";

export const deployBorrowLimit = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const BorrowLimitOracle = (await hre.ethers.getContractFactory(
    "BorrowLimitOracle"
  )) as BorrowLimitOracle__factory;
  const borrowLimitOracle = await BorrowLimitOracle.deploy(
    addressList["AdminProjectRouter"]
  );
  await borrowLimitOracle.deployTransaction
    .wait()
    .then((res) => res.transactionHash);

  console.log("BorrowLimitOracle: ", borrowLimitOracle.address);

  await addressUtils.saveAddresses(hre.network.name, {
    BorrowLimitOracle: borrowLimitOracle.address,
  });
};
