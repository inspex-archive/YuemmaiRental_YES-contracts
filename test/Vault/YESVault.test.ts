import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import hre from "hardhat";
import time from "../../utils/timeUtils";
import { Contracts, deployYESSystem } from "../shared/setup";
import { expectChanges } from "../shared/utils";

describe("YESVault", () => {
  const airdropAmount = hre.ethers.utils.parseEther("166.7");
  const acceptedKycLevel = 4;

  let signers: SignerWithAddress[];

  let contracts: Contracts;

  async function updatePrice() {
    await contracts.slidingWindowOracle
      .update(contracts.kkub.address, contracts.yes.address)
      .then((tx) => tx.wait());
    await contracts.slidingWindowOracle
      .update(contracts.kdai.address, contracts.yes.address)
      .then((tx) => tx.wait());
    await contracts.slidingWindowOracle
      .update(contracts.kusdt.address, contracts.yes.address)
      .then((tx) => tx.wait());
    await contracts.slidingWindowOracle
      .update(contracts.keth.address, contracts.yes.address)
      .then((tx) => tx.wait());
    await contracts.slidingWindowOracle
      .update(contracts.kbtc.address, contracts.yes.address)
      .then((tx) => tx.wait());
    await contracts.slidingWindowOracle
      .update(contracts.kusdc.address, contracts.yes.address)
      .then((tx) => tx.wait());
  }

  beforeEach(async function () {
    signers = await hre.ethers.getSigners();

    contracts = await deployYESSystem();
  });

  describe("Token Airdrop", function () {
    it("Should correctly releases tokens", async function () {
      const [, callHelper, alice] = signers;
      await contracts.yesVault
        .airdrop(alice.address, airdropAmount)
        .then((tx) => tx.wait());
      expect(await contracts.yesVault.tokensOf(alice.address)).to.eq(
        airdropAmount
      );
      expect(await contracts.yesVault.totalAllocated()).to.eq(airdropAmount);
    });

    it("Should locks tokens before release time", async function () {
      const [, callHelper, alice] = signers;
      await expect(
        contracts.yesVault.connect(alice).withdraw(airdropAmount)
      ).to.be.revertedWith("TokenTimelock: TIME_LOCKED");
    });

    it("Should unlocks tokens after release time", async function () {
      const [, callHelper, alice] = signers;

      await contracts.yesVault
        .airdrop(alice.address, airdropAmount)
        .then((tx) => tx.wait());

      const alicePreBalance = await contracts.yes.balanceOf(alice.address);
      const yesVaultPreBalance = await contracts.yes.balanceOf(
        contracts.yesVault.address
      );
      const preAllocated = await contracts.yesVault.totalAllocated();

      await time.increase(time.duration.years(1) + time.duration.days(7));

      await updatePrice();
      await contracts.yesVault.connect(alice).withdraw(airdropAmount);

      expect(await contracts.yes.balanceOf(alice.address)).to.eq(
        alicePreBalance.add(airdropAmount)
      );
      expect(await contracts.yes.balanceOf(contracts.yesVault.address)).to.eq(
        yesVaultPreBalance.sub(airdropAmount)
      );
      expect(await contracts.yesVault.totalAllocated()).to.eq(
        preAllocated.sub(airdropAmount)
      );
    });
  });

  describe("Deposit", function () {
    it("Should correctly deposit", async function () {
      const [owner] = signers;

      const preSenderBalance = await contracts.yes.balanceOf(owner.address);
      const preVaultBalance = await contracts.yes.balanceOf(
        contracts.yesVault.address
      );
      const preTokens = await contracts.yesVault.tokensOf(owner.address);

      await contracts.yes.approve(contracts.yesVault.address, airdropAmount);
      await contracts.yesVault.deposit(airdropAmount);

      expect(await contracts.yes.balanceOf(owner.address)).to.eq(
        preSenderBalance.sub(airdropAmount)
      );
      expect(await contracts.yes.balanceOf(contracts.yesVault.address)).to.eq(
        preVaultBalance.add(airdropAmount)
      );
      expect(await contracts.yesVault.tokensOf(owner.address)).to.eq(
        preTokens.add(airdropAmount)
      );
    });
  });

  describe("Deposit/Withdraw BK Next", function () {

    beforeEach(async () => {
      const [, callHelper, alice] = signers;
      await contracts.kyc.setKycCompleted(alice.address, acceptedKycLevel);
    })

    it("Should correctly deposit", async function () {
      const [owner, callHelper, alice] = signers;

      await contracts.yes.transfer(alice.address, airdropAmount);

      const preSenderBalance = await contracts.yes.balanceOf(alice.address);
      const preVaultBalance = await contracts.yes.balanceOf(
        contracts.yesVault.address
      );
      const preTokens = await contracts.yesVault.tokensOf(alice.address);

      await contracts.yesVault.connect(callHelper).depositBKNext(airdropAmount, alice.address);

      expect(await contracts.yes.balanceOf(alice.address)).to.eq(
        preSenderBalance.sub(airdropAmount)
      );
      expect(await contracts.yes.balanceOf(contracts.yesVault.address)).to.eq(
        preVaultBalance.add(airdropAmount)
      );
      expect(await contracts.yesVault.tokensOf(alice.address)).to.eq(
        preTokens.add(airdropAmount)
      );
    });

    it("Should correctly withdraw", async function () {
      const [, callHelper, alice] = signers;

      await contracts.yesVault
        .airdrop(alice.address, airdropAmount)
        .then((tx) => tx.wait());

      const alicePreBalance = await contracts.yes.balanceOf(alice.address);
      const yesVaultPreBalance = await contracts.yes.balanceOf(
        contracts.yesVault.address
      );
      const preAllocated = await contracts.yesVault.totalAllocated();

      await time.increase(time.duration.years(1) + time.duration.days(7));

      await updatePrice();
      await contracts.yesVault.connect(callHelper).withdrawBKNext(airdropAmount, alice.address);

      expect(await contracts.yes.balanceOf(alice.address)).to.eq(
        alicePreBalance.add(airdropAmount)
      );
      expect(await contracts.yes.balanceOf(contracts.yesVault.address)).to.eq(
        yesVaultPreBalance.sub(airdropAmount)
      );
      expect(await contracts.yesVault.totalAllocated()).to.eq(
        preAllocated.sub(airdropAmount)
      );
    });
  });
});
