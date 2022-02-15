import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai"
import { BigNumber, BigNumberish, ContractTransaction } from "ethers"
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { KAP20, MintableToken__factory, MintableToken, KAP20Lending, YESController, YESVault, BorrowLimitOracle } from "../../typechain"

export enum Change {
    INC,
    DEC
}

export const calculateAPY = (ratePerBlock: string) => {
    const blocksPerDay = 17280; // 5 seconds per block | 17,280 blocks per day
    const daysPerYear = 365;
    return ((((Number(ratePerBlock) * blocksPerDay) + 1) ** daysPerYear) - 1) * 100
}

export const supplyTokens = async (sender: SignerWithAddress, kap20Lending: KAP20Lending, amount: BigNumberish) => {
    const [owner] = await ethers.getSigners();
    const underlying = await kap20Lending.underlyingToken();
    const kap20 = MintableToken__factory.connect(underlying, owner);
    await kap20.mint(sender.address, amount);
    await kap20.connect(sender).approve(kap20Lending.address, amount);
    await kap20Lending.connect(sender).deposit(amount, sender.address);
}

export const enableBorrow = async (yesVault: YESVault, borrowLimitOracle: BorrowLimitOracle, borrower: SignerWithAddress, airdroppedYES: string = '1667') => {
    await yesVault.airdrop(borrower.address, parseEther(airdroppedYES));
    await borrowLimitOracle.setBorrowLimit(borrower.address, parseEther(airdroppedYES));
}

export const expectChanges = async (promise: () => Promise<ContractTransaction>, fetcher: (addr: string) => Promise<BigNumber>, addrList: string[], changes: BigNumber[], changeTypes?: Change[]) => {
    const preBalances = await Promise.all(addrList.map(addr => fetcher(addr)))
    await promise().then(t => t.wait())
    const postBalances = await Promise.all(addrList.map(addr => fetcher(addr)))
    preBalances.forEach((preBal, i) => {
        const postBal = postBalances[i];
        const change = changes[i];
        const changeType = changeTypes[i];
        const calculatedPost = changeType === Change.DEC ? preBal.sub(change) : preBal.add(change)
        expect(postBal).to.eq(calculatedPost)
    })
}

export const expectTokenChanges = (promise: () => Promise<ContractTransaction>, token: KAP20 | MintableToken, addrList: string[], changes: BigNumber[], changeTypes?: Change[]) => {
    return expectChanges(
        promise,
        token.balanceOf,
        addrList,
        changes,
        changeTypes
    )
}

export const expectBalanceChanges = async (promise: () => Promise<ContractTransaction>, addrList: string[], changes: BigNumber[], changeTypes?: Change[]) => {
    const [signer] = await ethers.getSigners();
    const preBalances = await Promise.all(addrList.map(addr => signer.provider.getBalance(addr)))
    const tx = await promise();
    const receipt = await tx.wait();
    const postBalances = await Promise.all(addrList.map(addr => signer.provider.getBalance(addr)))
    preBalances.forEach((preBal, i) => {
        const isSender = tx.from.toLowerCase() === addrList[i].toLowerCase();
        const txFee = isSender ? receipt.gasUsed.mul(tx.gasPrice) : BigNumber.from('0');
        const postBal = postBalances[i];
        const change = changes[i];
        const changeType = changeTypes[i];
        const calculatedPost = changeType === Change.DEC ? preBal.sub(change) : preBal.add(change);
        expect(postBal).to.eq(calculatedPost.sub(txFee))
    })
}


