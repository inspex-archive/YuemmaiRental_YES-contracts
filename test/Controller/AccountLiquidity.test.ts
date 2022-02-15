import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { constants } from "ethers";
import { ethers } from 'hardhat';

import { Contracts, deployYESSystem } from "../shared/setup";

describe("Controller", () => {

    let contracts: Contracts;
    let senders: SignerWithAddress[];

    let customer: SignerWithAddress;
    let nonCustomer: SignerWithAddress;

    const getAccountLiquidity = async (address: string) => {
        const result = await contracts.controller.getAccountLiquidity(address);
        return {
            err: result[0],
            collateralValue: result[1],
            borrowLimit: result[2],
            borrowValue: result[3]
        }
    }

    beforeEach(async () => {
        senders = await ethers.getSigners();
        contracts = await deployYESSystem();

        customer = senders[1];
        nonCustomer = senders[2];
    });

    it("Should correctly provide customer's account liquidity", async () => {
        const borrowLimit = parseEther('1000');
        const releaseAmount = parseEther('100');
        await contracts.borrowLimitOracle.setBorrowLimit(customer.address, borrowLimit);
        await contracts.yesVault.airdrop(customer.address, releaseAmount);

        const yesPrice = await contracts.priceOracle.getYESPrice();

        const result = await getAccountLiquidity(customer.address);
        const collateralFactor = await contracts.controller.collateralFactorMantissa();

        expect(result.borrowLimit).to.eq(borrowLimit.mul(yesPrice).div(parseEther('1')));
        expect(result.collateralValue).to.eq(releaseAmount.mul(collateralFactor).div(parseEther("1")));
    });

    it("Should correctly provide non-customer's account liquidity", async () => {
        const borrowLimit = parseEther('1000');
        const transferredAmount = parseEther('2000');
        await contracts.borrowLimitOracle.setBorrowLimit(nonCustomer.address, borrowLimit);
        await contracts.yes.transfer(nonCustomer.address, transferredAmount);

        await contracts.yes.connect(nonCustomer).approve(contracts.yesVault.address, constants.MaxUint256);
        await contracts.yesVault.connect(nonCustomer).deposit(transferredAmount);

        const result = await getAccountLiquidity(nonCustomer.address);
        const collateralFactor = await contracts.controller.collateralFactorMantissa()
        expect(result.borrowLimit).to.eq(transferredAmount.mul(collateralFactor).div(parseEther("1")));
        expect(result.collateralValue).to.eq(transferredAmount.mul(collateralFactor).div(parseEther("1")));
    });

});