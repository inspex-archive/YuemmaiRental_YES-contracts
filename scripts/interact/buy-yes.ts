import { parseEther } from "@ethersproject/units";
import hre, { ethers } from "hardhat";
import {
  AdminProject__factory,
  SwapRouter__factory,
  YESToken__factory,
} from "../../typechain";
import addressUtils from "../../utils/addressUtils";
import timeUtils from "../../utils/timeUtils";

async function main() {
  const [owner] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(hre.network.name);

  console.log("address: ", owner.address);

  const router = SwapRouter__factory.connect(addressList["SwapRouter"], owner);

  await router
    .swapExactETHForTokens(
      0,
      [addressList["KKUB"], addressList["YES"]],
      owner.address,
      timeUtils.now() + timeUtils.duration.minutes(20),
      { value: parseEther('900')}
    )
    .then((tx) => tx.wait());

    console.log("Trade success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
