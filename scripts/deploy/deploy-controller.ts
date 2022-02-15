import hre from "hardhat";
import { YESController__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";

export const deployController = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const YESController = (await hre.ethers.getContractFactory(
    "YESController"
  )) as YESController__factory;
  const yesController = await YESController.deploy(
    addressList["AdminProjectRouter"],
    addressList["BorrowLimitOracle"]
  );
  await yesController.deployTransaction
    .wait()
    .then((res) => res.transactionHash);

  console.log("YES Controller: ", yesController.address);

  await addressUtils.saveAddresses(hre.network.name, {
    YESController: yesController.address,
  });
};
