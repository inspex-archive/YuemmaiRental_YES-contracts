import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { formatEther } from "ethers/lib/utils";
import hre from "hardhat";
import {
  YESToken__factory,
  SwapRouter__factory,
  SwapRouter,
  YESToken,
  MintableToken__factory,
  MintableToken,
} from "../../typechain";
import addressUtils from "../../utils/addressUtils";
import timeUtils from "../../utils/timeUtils";

// Public sale YES = 1,200,000 YES. Split into 5 parts, 240,000 per part
// Alpha test: Public sale = 40,000,000. split  into 4 parts, 10,000,000 YES per part

const poolReserves = {
  KUBYES: [
    hre.ethers.utils.parseEther("1000"), // 1 KUB = 12.93 USD
    hre.ethers.utils.parseEther("16162.5"), // 1 YES = 26.74 THB = 0.8 USD
  ],
  KBTCYES: [
    hre.ethers.utils.parseEther("15.15"), // 1 KBTC = 44,002.90 USD
    hre.ethers.utils.parseEther("833333"), // 1 YES = 26.74 THB = 0.8 USD
  ],
  KETHYES: [
    hre.ethers.utils.parseEther("201.064"), // 1 ETH = 3,315.68 USD
    hre.ethers.utils.parseEther("833333"), // 1 YES = 26.74 THB = 0.8 USD
  ],
  KDAIYES: [
    hre.ethers.utils.parseEther("666666"), // 1 KDAI = 33.43 THB = 1 USD
    hre.ethers.utils.parseEther("833333"), // 1 YES = 26.74 THB = 0.8 USD
  ],
  KUSDCYES: [
    hre.ethers.utils.parseEther("666666"), // 1 KUSDC = 33.43 THB = 1 USD
    hre.ethers.utils.parseEther("833333"), // 1 YES = 26.74 THB = 0.8 USD
  ],
  KUSDTYES: [
    hre.ethers.utils.parseEther("666666"), // 1 KUSDT = 33.43 THB = 1 USD
    hre.ethers.utils.parseEther("833333"), // 1 YES = 26.74 THB = 0.8 USD
  ],
};

const getGasPrice = (signer: SignerWithAddress, addPercent = 120) =>
  signer.getGasPrice().then((price) => price.mul(addPercent).div(100));

const addLiquidity = async (
  signer: SignerWithAddress,
  token: MintableToken,
  yesToken: YESToken,
  swapRouter: SwapRouter,
  key: string
) => {
  await token
    .approve(swapRouter.address, hre.ethers.constants.MaxUint256)
    .then((tx) => tx.wait());
  console.log(`${key}: Approve to Swap router success`);

  console.log("Provide: ", +poolReserves[key][0] + " " + key);
  console.log("Provide: ", +poolReserves[key][1] + " " + "YES");

  await swapRouter
    .connect(signer)
    .addLiquidity(
      token.address,
      yesToken.address,
      poolReserves[key][0],
      poolReserves[key][1],
      poolReserves[key][0].mul(99).div(100),
      poolReserves[key][1].mul(99).div(100),
      signer.address,
      timeUtils.now() + timeUtils.duration.hours(1)
    )
    .then((tx) => tx.wait());
  console.log(`${key}: Add liquidity success`);
};

const addLiquidityETH = async (
  signer: SignerWithAddress,
  yesToken: YESToken,
  swapRouter: SwapRouter
) => {
  console.log("Provide: ", +poolReserves.KUBYES[0] + " " + "KUB");
  console.log("Provide: ", +poolReserves.KUBYES[1] + " " + "YES");

  await swapRouter
    .connect(signer)
    .addLiquidityETH(
      yesToken.address,
      poolReserves.KUBYES[1],
      poolReserves.KUBYES[1].mul(99).div(100),
      poolReserves.KUBYES[0].mul(99).div(100),
      signer.address,
      timeUtils.now() + timeUtils.duration.hours(1),
      { value: poolReserves.KUBYES[0] }
    )
    .then((tx) => tx.wait());
  console.log("Add liquidity KUB-YES success");
};

export const addSwapLiquidity = async () => {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const [owner] = await hre.ethers.getSigners();

  const MintableToken = (await hre.ethers.getContractFactory(
    "MintableToken"
  )) as MintableToken__factory;
  const YESToken = (await hre.ethers.getContractFactory(
    "YESToken"
  )) as YESToken__factory;
  const SwapRouter = (await hre.ethers.getContractFactory(
    "SwapRouter"
  )) as SwapRouter__factory;

  const kbtc = await MintableToken.attach(addressList["KBTC"]);
  const keth = await MintableToken.attach(addressList["KETH"]);
  const kdai = await MintableToken.attach(addressList["KDAI"]);
  const kusdt = await MintableToken.attach(addressList["KUSDT"]);
  const kusdc = await MintableToken.attach(addressList["KUSDC"]);
  const yesToken = await YESToken.attach(addressList["YES"]);

  const swapRouter = await SwapRouter.attach(addressList["SwapRouter"]);

  await yesToken
    .connect(owner)
    .approve(swapRouter.address, hre.ethers.constants.MaxUint256)
    .then((tx) => tx.wait());
  console.log("Approve YES to Swap router success");

  await addLiquidity(owner, kbtc, yesToken, swapRouter, "KBTCYES");
  await addLiquidity(owner, keth, yesToken, swapRouter, "KETHYES");
  await addLiquidity(owner, kdai, yesToken, swapRouter, "KDAIYES");
  await addLiquidity(owner, kusdt, yesToken, swapRouter, "KUSDTYES");
  await addLiquidity(owner, kusdc, yesToken, swapRouter, "KUSDCYES");

  console.log("Balance: ", await owner.provider.getBalance(owner.address).then(res => formatEther(res)));
  console.log("YES: ", await yesToken.balanceOf(owner.address).then(res => formatEther(res)));

  await addLiquidityETH(owner, yesToken, swapRouter);
};
