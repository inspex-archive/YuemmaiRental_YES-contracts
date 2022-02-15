import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { formatEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { TokenError, TokenFailureInfo } from "../shared/error";
import { Contracts, deployYESSystem } from "../shared/setup";
import { Change, enableBorrow, expectBalanceChanges } from "../shared/utils";

describe("Lendings - BorrowAndRepayKUB", () => {
  let contracts: Contracts;
  let senders: SignerWithAddress[];

  let owner: SignerWithAddress;
  let callHelper: SignerWithAddress;
  let borrower: SignerWithAddress;
  let borrowAmount = parseEther("0.099465");

  beforeEach(async () => {
    senders = await ethers.getSigners();
    contracts = await deployYESSystem();

    owner = senders[0];
    callHelper = senders[1];
    borrower = senders[2];

    await contracts.kubLending._setPoolReserveFactor(parseEther("0.1"));
    await contracts.kubLending._setPoolReserveExecutionPoint(parseEther("1"));
  });

  describe("borrowKUB", () => {
    it("fails if protocol has less than borrowAmount of underlying", async () => {
      await enableBorrow(
        contracts.yesVault,
        contracts.borrowLimitOracle,
        borrower
      );

      expect(
        await contracts.kubLending
          .connect(borrower)
          .borrow(borrowAmount, borrower.address)
      )
        .to.emit(contracts.kubLending, "Failure")
        .withArgs(
          TokenError.TOKEN_INSUFFICIENT_CASH,
          TokenFailureInfo.BORROW_CASH_NOT_AVAILABLE,
          0
        );
    });

    it("Should correctly lends tokens", async function () {
      const amount = parseEther("100");
      await contracts.kubLending
        .connect(borrower)
        .deposit(amount, borrower.address, { value: amount });
      await enableBorrow(
        contracts.yesVault,
        contracts.borrowLimitOracle,
        borrower
      );

      await expectBalanceChanges(
        () =>
          contracts.kubLending
            .connect(borrower)
            .borrow(borrowAmount, borrower.address),
        [borrower.address, contracts.kubLending.address],
        [borrowAmount, borrowAmount],
        [Change.INC, Change.DEC]
      );
    });
  });

  describe("repayBorrow KUB", () => {
    beforeEach(async () => {
      const amount = parseEther("100");
      await enableBorrow(
        contracts.yesVault,
        contracts.borrowLimitOracle,
        borrower
      );
      await contracts.kubLending
        .connect(borrower)
        .deposit(amount, borrower.address, { value: amount });
    });

    it("Should correctly operates repayment", async function () {
      await contracts.kubLending
        .connect(borrower)
        .borrow(borrowAmount, borrower.address);
      await expectBalanceChanges(
        () =>
          contracts.kubLending
            .connect(borrower)
            .repayBorrow(borrowAmount, borrower.address, {
              value: borrowAmount,
            }),
        [borrower.address, contracts.kubLending.address],
        [borrowAmount, borrowAmount],
        [Change.DEC, Change.INC]
      );
    });

    it("Should correctly operates withdraw", async function () {
      await contracts.kubLending
        .connect(borrower)
        .deposit(borrowAmount, borrower.address, { value: borrowAmount });

      await expectBalanceChanges(
        () =>
          contracts.kubLending
            .connect(borrower)
            .withdraw(borrowAmount, borrower.address),
        [borrower.address, contracts.kubLending.address],
        [borrowAmount, borrowAmount],
        [Change.INC, Change.DEC]
      );
    });
  });

  describe("borrowKUB BKNext", () => {
    beforeEach(async () => {
      const [owner, callHelper] = senders;
      await contracts.kyc.setKycCompleted(borrower.address, 4);
      await contracts.kyc.setKycCompleted(owner.address, 4);

      await contracts.kkub.deposit({ value: borrowAmount });
      await contracts.kubLending
        .connect(callHelper)
        .deposit(borrowAmount, owner.address);
    });

    it("Should correctly lends tokens", async function () {
      await enableBorrow(
        contracts.yesVault,
        contracts.borrowLimitOracle,
        borrower
      );

      const preBorrowerBal = await contracts.kkub.balanceOf(borrower.address);
      const preContractBal = await owner.provider.getBalance(
        contracts.kubLending.address
      );

      await contracts.kubLending
        .connect(callHelper)
        .borrow(borrowAmount, borrower.address)

      const postBorrowerBal = await contracts.kkub.balanceOf(borrower.address);
      const postContractBal = await owner.provider.getBalance(
        contracts.kubLending.address
      );

      expect(postBorrowerBal).to.gt(preBorrowerBal);
      expect(postContractBal).to.lt(preContractBal);
    });

    it("Should correctly operates withdraw", async function () {
      const [owner] = senders;

      await contracts.kkub.connect(borrower).deposit({ value: borrowAmount });

      await contracts.kubLending
        .connect(callHelper)
        .deposit(borrowAmount, borrower.address);

      const preBorrowerBal = await contracts.kkub.balanceOf(borrower.address);
      const preContractBal = await owner.provider.getBalance(
        contracts.kubLending.address
      );

      await contracts.kubLending
            .connect(callHelper)
            .withdraw(borrowAmount, borrower.address)

      const postBorrowerBal = await contracts.kkub.balanceOf(borrower.address);
      const postContractBal = await owner.provider.getBalance(
        contracts.kubLending.address
      );

      expect(postBorrowerBal).to.gt(preBorrowerBal);
      expect(postContractBal).to.lt(preContractBal);

    });

    it("Should correctly operates repayment", async function () {
      await enableBorrow(
        contracts.yesVault,
        contracts.borrowLimitOracle,
        borrower
      );

      await contracts.kubLending
        .connect(callHelper)
        .borrow(borrowAmount, borrower.address);

      const preBorrowerBal = await contracts.kkub.balanceOf(borrower.address);
      const preContractBal = await owner.provider.getBalance(
        contracts.kubLending.address
      );

      await contracts.kubLending
        .connect(callHelper)
        .repayBorrow(borrowAmount, borrower.address);

      const postBorrowerBal = await contracts.kkub.balanceOf(borrower.address);
      const postContractBal = await owner.provider.getBalance(
        contracts.kubLending.address
      );

      expect(postBorrowerBal).to.lt(preBorrowerBal);
      expect(postContractBal).to.gt(preContractBal);
    });
  });
});
