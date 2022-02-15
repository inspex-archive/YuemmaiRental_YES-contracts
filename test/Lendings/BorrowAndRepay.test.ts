import { BigNumberish } from '@ethersproject/bignumber';
import { parseEther } from '@ethersproject/units';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { KAP20Lending, MintableToken__factory } from '../../typechain';
import { TokenError, TokenFailureInfo } from '../shared/error';
import { Contracts, deployYESSystem } from '../shared/setup';
import { Change, enableBorrow, expectTokenChanges, supplyTokens } from '../shared/utils';

describe('Lending - BorrowAndRepay', () => {

    let contracts: Contracts;
    let senders: SignerWithAddress[];

    let owner: SignerWithAddress;
    let callHelper: SignerWithAddress;
    let borrower: SignerWithAddress;
    let borrowAmount = parseEther('10')

    beforeEach(async () => {
        senders = await ethers.getSigners();
        contracts = await deployYESSystem();

        owner = senders[0];
        callHelper = senders[1];
        borrower = senders[2];

        await contracts.kusdtLending._setPoolReserveExecutionPoint(parseEther('1'));
    })

    describe('borrow', () => {

        it("fails if protocol has less than borrowAmount of underlying", async () => {
            await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower);

            expect(await contracts.kusdtLending.connect(borrower).borrow(borrowAmount, borrower.address))
                .to.emit(contracts.kusdtLending, 'Failure')
                .withArgs(TokenError.TOKEN_INSUFFICIENT_CASH, TokenFailureInfo.BORROW_CASH_NOT_AVAILABLE, 0);
        });

        it('Should correctly lends tokens', async function () {
            await supplyTokens(borrower, contracts.kusdtLending, parseEther('100000'));
            await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower);

            await expectTokenChanges(
                () => contracts.kusdtLending.connect(borrower).borrow(borrowAmount, borrower.address),
                contracts.kusdt,
                [borrower.address, contracts.kusdtLending.address],
                [borrowAmount, borrowAmount],
                [Change.INC, Change.DEC]
            )
        })

    })

    describe('repayBorrow', () => {

        beforeEach(async () => {
            await supplyTokens(borrower, contracts.kusdtLending, parseEther('100000'));
            await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower);

            await contracts.kusdt.connect(borrower).approve(contracts.kusdtLending.address, borrowAmount);
        })

        it('Should correctly operates repayment', async function () {
            await contracts.kusdtLending.connect(borrower).borrow(borrowAmount, borrower.address);
            await expectTokenChanges(
                () => contracts.kusdtLending.connect(borrower).repayBorrow(borrowAmount, borrower.address),
                contracts.kusdt,
                [borrower.address, contracts.kusdtLending.address],
                [borrowAmount, borrowAmount],
                [Change.DEC, Change.INC]
            )
        })

    });

    describe('BK next', () => {

        beforeEach(async () => {
            await contracts.kyc.setKycCompleted(borrower.address, 4);
        })

        it('Should correctly lends tokens', async function () {
            await supplyTokens(borrower, contracts.kusdtLending, parseEther('100000'));
            await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower);

            await expectTokenChanges(
                () => contracts.kusdtLending.connect(callHelper).borrow(borrowAmount, borrower.address),
                contracts.kusdt,
                [borrower.address, contracts.kusdtLending.address],
                [borrowAmount, borrowAmount],
                [Change.INC, Change.DEC]
            )
        })

        it('Should correctly operates withdraw', async function () {
            const amount = parseEther('100000')
            await supplyTokens(borrower, contracts.kusdtLending, amount);

            await expectTokenChanges(
                () => contracts.kusdtLending.connect(callHelper).withdraw(amount, borrower.address),
                contracts.kusdt,
                [borrower.address, contracts.kusdtLending.address],
                [amount, amount],
                [Change.INC, Change.DEC]
            )
        })

        it('Should correctly operates repayment', async function () {
            await supplyTokens(borrower, contracts.kusdtLending, parseEther('100000'));
            await enableBorrow(contracts.yesVault, contracts.borrowLimitOracle, borrower);

            await contracts.kusdtLending.connect(callHelper).borrow(borrowAmount, borrower.address);

            await expectTokenChanges(
                () => contracts.kusdtLending.connect(callHelper).repayBorrow(borrowAmount, borrower.address),
                contracts.kusdt,
                [borrower.address, contracts.kusdtLending.address],
                [borrowAmount, borrowAmount],
                [Change.DEC, Change.INC]
            )
        })

    })

})