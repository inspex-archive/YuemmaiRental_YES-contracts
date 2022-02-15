import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { formatEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { Contracts, deployYESSystem } from "../shared/setup";
import { enableBorrow, supplyTokens } from "../shared/utils";

describe("Lendings - Liquidate", () => {
  let contracts: Contracts;
  let senders: SignerWithAddress[];

  let depositAmount = parseEther("100");

  beforeEach(async () => {
    senders = await ethers.getSigners();
    contracts = await deployYESSystem();
  });

  it("should be able to liquidate borrow KUB", async () => {
    const [owner, callHelper, borrower, liquidator] = senders;
    const borrowAmount = parseEther("0.013333333");

    await contracts.kubLending.connect(borrower).deposit(depositAmount, borrower.address, { value: depositAmount });

    await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower, "1");

    await contracts.kubLending
      .connect(borrower)
      .borrow(borrowAmount, borrower.address)

    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kubLending.accrueInterest().then((tx) => tx.wait());

    const accountLiquidity1 = await contracts.controller.getAccountLiquidity(
      borrower.address
    );

    await contracts.kubLending
      .connect(liquidator)
      .liquidateBorrow(borrower.address, liquidator.address)
      .then((tx) => tx.wait());

    const accountLiquidity2 = await contracts.controller.getAccountLiquidity(
      borrower.address
    );

    expect(accountLiquidity2[1]).to.lt(accountLiquidity1[1]);
    expect(accountLiquidity2[3]).to.lt(accountLiquidity1[3]);
  });

  it("should be able to liquidate borrow token", async () => {
    const [owner, callHelper, borrower, liquidator] = senders;
    const borrowAmount = parseEther("0.2");

    await supplyTokens(borrower, contracts.kusdtLending, depositAmount);

    await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower, "1");

    await contracts.kusdtLending
      .connect(borrower)
      .borrow(borrowAmount, borrower.address)
      .then((tx) => tx.wait());

    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());

    const accountLiquidity1 = await contracts.controller.getAccountLiquidity(
      borrower.address
    );

    await contracts.kusdtLending
      .connect(liquidator)
      .liquidateBorrow(borrower.address, liquidator.address)
      .then((tx) => tx.wait());

    const accountLiquidity2 = await contracts.controller.getAccountLiquidity(
      borrower.address
    );

    expect(accountLiquidity2[1]).to.lt(accountLiquidity1[1]);
    expect(accountLiquidity2[3]).to.lt(accountLiquidity1[3]);
  });

  it("BKNext should be able to liquidate borrow token", async () => {
    const [owner, callHelper, borrower, liquidator] = senders;
    const borrowAmount = parseEther("0.2");

    await contracts.kyc.setKycCompleted(liquidator.address, 4);

    await supplyTokens(borrower, contracts.kusdtLending, depositAmount);

    await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower, "1");

    await contracts.kusdtLending
      .connect(borrower)
      .borrow(borrowAmount, borrower.address)
      .then((tx) => tx.wait());

    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());
    await contracts.kusdtLending.accrueInterest().then((tx) => tx.wait());

    const accountLiquidity1 = await contracts.controller.getAccountLiquidity(
      borrower.address
    );

    await contracts.kusdtLending
      .connect(owner)
      .liquidateBorrow(borrower.address, liquidator.address)
      .then((tx) => tx.wait());

    const accountLiquidity2 = await contracts.controller.getAccountLiquidity(
      borrower.address
    );

    expect(accountLiquidity2[1]).to.lt(accountLiquidity1[1]);
    expect(accountLiquidity2[3]).to.lt(accountLiquidity1[3]);
  });


});
