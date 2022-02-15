import hre, { ethers } from "hardhat";
import {
  SlidingWindowOracle__factory,
  YESPriceOracle__factory,
} from "../../typechain";
import addressUtils from "../../utils/addressUtils";

export const updateOracle = async () => {
  const [owner] = await ethers.getSigners();

  const addressList = await addressUtils.getAddressList(hre.network.name);
  const SlidingWindowOracle = (await hre.ethers.getContractFactory(
    "SlidingWindowOracle"
  )) as SlidingWindowOracle__factory;

  const slidingWindowOracle = await SlidingWindowOracle.attach(
    addressList["SlidingWindowOracle"]
  );

  await slidingWindowOracle
    .update(addressList["KKUB"], addressList["YES"])
    .then((tx) => tx.wait());
  console.log("Updated KKUB-YES price");


  await slidingWindowOracle
    .update(addressList["KBTC"], addressList["YES"])
    .then((tx) => tx.wait());
  console.log("Updated KBTC-YES price");

  await slidingWindowOracle
    .update(addressList["KETH"], addressList["YES"])
    .then((tx) => tx.wait());
  console.log("Updated KETH-YES price");

  await slidingWindowOracle
    .update(addressList["KDAI"], addressList["YES"])
    .then((tx) => tx.wait());
  console.log("Updated KDAI-YES price");

  await slidingWindowOracle
    .update(addressList["KUSDT"], addressList["YES"])
    .then((tx) => tx.wait());
  console.log("Updated KUSDT-YES price");

  await slidingWindowOracle
    .update(addressList["KUSDC"], addressList["YES"])
    .then((tx) => tx.wait());
  console.log("Updated KUSDC-YES price");

  const yesPriceOracle = await YESPriceOracle__factory.connect(
    addressList["YESPriceOracle"],
    owner
  );

  await yesPriceOracle
    ._addStableCoin(addressList["KDAI"])
    .then((tx) => tx.wait());
  console.log("Add KDAI to stable coins");

  await yesPriceOracle
    ._addStableCoin(addressList["KUSDT"])
    .then((tx) => tx.wait());
  console.log("Add KUSDT to stable coins");

  await yesPriceOracle
    ._addStableCoin(addressList["KUSDC"])
    .then((tx) => tx.wait());
  console.log("Add KUSDC to stable coins");
};
