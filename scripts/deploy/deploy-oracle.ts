import hre from "hardhat";
import { SlidingWindowOracle__factory, YESPriceOracle__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";
import timeUtils from '../../utils/timeUtils';

export const deployOracle = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);

  const SlidingWindowOracle = await hre.ethers.getContractFactory('SlidingWindowOracle') as SlidingWindowOracle__factory;
  const YESPriceOracle = await hre.ethers.getContractFactory('YESPriceOracle') as YESPriceOracle__factory;

  const slidingWindowOracle = await SlidingWindowOracle.deploy(addressList['SwapFactory'], timeUtils.duration.hours(24), 2);
  await slidingWindowOracle.deployTransaction.wait();
  console.log("Deployed sliding window oracle: ", slidingWindowOracle.address);

  const yesPriceOracle = await YESPriceOracle.deploy(slidingWindowOracle.address, addressList['KKUB'], addressList['YES']);
  await yesPriceOracle.deployTransaction.wait();
  console.log("Deploy success: ", yesPriceOracle.address);

  await addressUtils.saveAddresses(hre.network.name, { YESPriceOracle: yesPriceOracle.address, SlidingWindowOracle: slidingWindowOracle.address });
}