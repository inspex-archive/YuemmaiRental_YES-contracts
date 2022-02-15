import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from 'hardhat';

import { Contracts, deployYESSystem } from "../shared/setup";

describe("PriceOracle", () => {

    let contracts: Contracts;
    let senders: SignerWithAddress[];

    const getTokenPrice = async (token: string) => {
        return contracts.priceOracle.getLatestPrice(token)
    };

    beforeEach(async () => {
        senders = await ethers.getSigners();
        contracts = await deployYESSystem();
    });

    it("Should correctly provide token price", async () => {
        expect(await getTokenPrice(await contracts.kubLending.underlyingToken())).to.gt("0");
        expect(await getTokenPrice(await contracts.kbtcLending.underlyingToken())).to.gt("0");
        expect(await getTokenPrice(await contracts.kethLending.underlyingToken())).to.gt("0");
        expect(await getTokenPrice(await contracts.kusdtLending.underlyingToken())).to.gt("0");
        expect(await getTokenPrice(await contracts.kusdcLending.underlyingToken())).to.gt("0");
        expect(await getTokenPrice(await contracts.kdaiLending.underlyingToken())).to.gt("0");
    });

});
