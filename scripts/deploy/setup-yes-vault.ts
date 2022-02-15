import { formatEther, parseEther } from "@ethersproject/units";
import hre, { ethers } from "hardhat";
import {
  AdminProject__factory,
  YESToken__factory,
  YESVault__factory,
} from "../../typechain";
import addressUtils from "../../utils/addressUtils";

const projectName = "yuemmai";

export const setupYESVault = async () => {
  const [owner] = await ethers.getSigners();
  const totalAirdrop = parseEther("2500000");

  const addressList = await addressUtils.getAddressList(hre.network.name);

  const YESVault = (await hre.ethers.getContractFactory(
    "YESVault"
  )) as YESVault__factory;
  const yesVault = await YESVault.attach(addressList["YESVault"]);

  const YESToken = (await hre.ethers.getContractFactory(
    "YESToken"
  )) as YESToken__factory;
  const yes = await YESToken.attach(addressList["YES"]);

  await yesVault
    ._setSlippageTolerrance(parseEther("0.05"))
    .then((tx) => tx.wait());
  console.log(
    "Set slippage tolerrance to: ",
    await yesVault.slippageTolerrance().then((res) => formatEther(res))
  );

  await yesVault._setMarket(addressList["SwapRouter"]);
  console.log("Set market to " + (await yesVault.market()));

  await yesVault
    ._setMarketImpl(addressList["MarketImpl"])
    .then((tx) => tx.wait());
  console.log("Set market Impl to: ", await yesVault.marketImpl());

  await yes.transfer(yesVault.address, totalAirdrop).then((tx) => tx.wait());
  console.log(
    "Initial airdrop amount: ",
    await yes.balanceOf(yesVault.address).then((res) => formatEther(res))
  );

  const adminProject = AdminProject__factory.connect(
    addressList["AdminProject"],
    owner
  );
  await adminProject.addSuperAdmin(yesVault.address, projectName);
  console.log("Added vault to be a super admin")
};
