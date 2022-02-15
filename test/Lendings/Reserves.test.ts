import { BigNumber } from '@ethersproject/bignumber';
import { parseEther } from '@ethersproject/units';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { constants } from 'ethers';
import { ethers } from 'hardhat';
import time from '../../utils/timeUtils';
import { Contracts, deployYESSystem } from '../shared/setup';
import { enableBorrow, supplyTokens } from '../shared/utils';

describe('Lendings - Reserves', () => {

  let contracts: Contracts;
  let senders: SignerWithAddress[];

  let borrower: SignerWithAddress;
  let borrowAmount = parseEther('0.099465');

  const borrowAndRepay = async () => {
    await contracts.kusdtLending.connect(borrower).borrow(borrowAmount, borrower.address);

    for (let i = 0; i < 10; i++) {
      await time.advanceBlock();
    }

    return contracts.kusdtLending.connect(borrower).repayBorrow(constants.MaxUint256, borrower.address);
  }

  const borrowAndRepayETH = async () => {
    await contracts.kubLending.connect(borrower).borrow(borrowAmount, borrower.address);

    for (let i = 0; i < 10; i++) {
      await time.advanceBlock();
    }

    return contracts.kubLending.connect(borrower).repayBorrow(borrowAmount, borrower.address, { value: borrowAmount });
  }

  beforeEach(async () => {
    senders = await ethers.getSigners();
    contracts = await deployYESSystem();
    borrower = senders[2];

    await supplyTokens(borrower, contracts.kusdtLending, parseEther('300'));
    await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower);

    await contracts.kusdt.connect(borrower).approve(contracts.kusdtLending.address, constants.MaxUint256);
    await contracts.kusdt.mint(borrower.address, parseEther('10000'));

    await contracts.kusdtLending._setPlatformReserveFactor(parseEther('0.1')); // 10%
    await contracts.kusdtLending._setPoolReserveFactor(parseEther('0.1')); // 10%
  })

  describe('reserve accumulation', () => {

    it("Should correctly accumulate reserves", async () => {
      await contracts.kusdtLending._setPlatformReserveExecutionPoint(parseEther('10000000'));
      await contracts.kusdtLending._setPoolReserveExecutionPoint(parseEther('10000000'));

      const initialCash = await contracts.kusdtLending.getCash();

      await borrowAndRepay();

      const cash = await contracts.kusdtLending.getCash();
      const deltaCash = cash.sub(initialCash);
      const expectedPlatformReserve = deltaCash.mul('10').div('100')
      const expectedPoolReserve = deltaCash.mul('10').div('100')

      expect(Number(await contracts.kusdtLending.platformReserves())).to.be.within(+expectedPlatformReserve.sub(100), +expectedPlatformReserve.add(100))
      expect(Number(await contracts.kusdtLending.poolReserves())).to.be.within(+expectedPoolReserve.sub(100), +expectedPlatformReserve.add(100))
    });

  })

  describe('reserve execution', () => {

    beforeEach(async () => {
      await contracts.kusdtLending._setBeneficiary(senders[0].address);
    })

    it('Should transfer to owner address', async function () {
      const initialOwnerTokens = await contracts.kusdt.balanceOf(senders[0].address);

      await borrowAndRepay();

      expect(await contracts.kusdt.balanceOf(senders[0].address)).to.gte(initialOwnerTokens);
      expect(await contracts.kusdtLending.platformReserves()).to.eq(BigNumber.from(0));
    })

    it('Should swap back YES', async function () {
      const initialYESInPool = await contracts.yes.balanceOf(contracts.yesVault.address);

      await borrowAndRepay();

      expect(await contracts.yes.balanceOf(contracts.yesVault.address)).to.gte(initialYESInPool);
      expect(await contracts.kusdtLending.poolReserves()).to.eq(BigNumber.from(0));
    })

  })

  describe('reserve execution ETH', () => {

    beforeEach(async () => {
      const amount = parseEther('100')
      const [owner] = senders;
      await contracts.kubLending.deposit(amount, owner.address, { value: parseEther('100') });
      await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower);

      await contracts.kubLending._setPlatformReserveFactor(parseEther('0.1')); // 10%
      await contracts.kubLending._setPoolReserveFactor(parseEther('0.1')); // 10%

      await contracts.kubLending._setBeneficiary(senders[0].address);
    })

    it('Should transfer to owner address', async function () {
      const initialOwnerTokens = await senders[0].provider.getBalance(senders[0].address);

      await borrowAndRepayETH();

      expect(await senders[0].provider.getBalance(senders[0].address)).to.gte(initialOwnerTokens);
      expect(await contracts.kubLending.platformReserves()).to.eq(BigNumber.from(0));
    })

    it('Should swap back YES', async function () {
      const initialYESInPool = await contracts.yes.balanceOf(contracts.yesVault.address);

      await borrowAndRepayETH();

      expect(await contracts.yes.balanceOf(contracts.yesVault.address)).to.gte(initialYESInPool);
      expect(await contracts.kubLending.poolReserves()).to.eq(BigNumber.from(0));
    })

  })

})
