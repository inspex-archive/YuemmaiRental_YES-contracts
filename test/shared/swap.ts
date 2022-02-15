import { parseEther, parseUnits } from "@ethersproject/units";
import { ethers } from "hardhat";
import { MintableToken__factory, SwapFactory__factory, SwapPair__factory, SwapRouter__factory } from "../../typechain";
import timeUtils from "../../utils/timeUtils";

export const addLiquidity = async (routerAddr: string, token0Addr: string, token1Addr: string, amount0: string, amount1: string) => {
    const [owner] = await ethers.getSigners();
    const swapRouter = await SwapRouter__factory.connect(routerAddr, owner);

    const token0 = await MintableToken__factory.connect(token0Addr, owner);
    const token1 = await MintableToken__factory.connect(token1Addr, owner);

    const decimals0 = await token0.decimals();
    const decimals1 = await token1.decimals();

    const parsedAmount0 = parseUnits(amount0, decimals0);
    const parsedAmount1 = parseUnits(amount1, decimals1);

    await token0.approve(routerAddr, ethers.constants.MaxUint256);
    await token1.approve(routerAddr, ethers.constants.MaxUint256);

    const txDeadline = await timeUtils.latest() + timeUtils.duration.minutes(10);

    return swapRouter
        .connect(owner)
        .addLiquidity(
            token0Addr,
            token1Addr,
            parsedAmount0,
            parsedAmount1,
            parsedAmount0.mul(99).div(100),
            parsedAmount1.mul(99).div(100),
            owner.address,
            txDeadline
        ).then(tx => tx.wait());
}

export const addLiquidityETH = async (routerAddr: string, tokenAddr: string, amountToken: string, amountETH: string) => {
    const [owner] = await ethers.getSigners();
    const swapRouter = await SwapRouter__factory.connect(routerAddr, owner);

    const token = await MintableToken__factory.connect(tokenAddr, owner);

    const decimals = await token.decimals();

    const parsedAmountToken = parseUnits(amountToken, decimals);
    const parsedAmountETH = parseEther(amountETH);

    await token.approve(routerAddr, ethers.constants.MaxUint256);

    const txDeadline = await timeUtils.latest() + timeUtils.duration.minutes(10);

    return swapRouter
        .connect(owner)
        .addLiquidityETH(
            tokenAddr,
            parsedAmountToken,
            parsedAmountToken.mul(99).div(100),
            parsedAmountETH.mul(99).div(100),
            owner.address,
            txDeadline,
            { value: parsedAmountETH }
        ).then(tx => tx.wait());
}

export const getPair = async (factoryAddr: string, token0Addr: string, token1Addr: string) => {
    const [owner] = await ethers.getSigners();
    const factory = SwapFactory__factory.connect(factoryAddr, owner);
    const pairAddr = await factory.getPair(token0Addr, token1Addr);
    return SwapPair__factory.connect(pairAddr, owner);
}