import { parseEther } from "@ethersproject/units";
import hre, { ethers } from "hardhat";
import {
  AdminProject__factory,
  KAP20Lending__factory,
  KUBLending__factory,
} from "../../typechain";
import addressUtils from "../../utils/addressUtils";

const projectName = "yuemmai";

const setupLending = async (token: string) => {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const [owner] = await ethers.getSigners();
  console.log(`Setup ${token}`);

  const lending =
    token === "KUB"
      ? KUBLending__factory.connect(addressList["KUBLending"], owner)
      : KAP20Lending__factory.connect(addressList[`${token}Lending`], owner);

  await lending._setBeneficiary(owner.address).then((tx) => tx.wait());
  console.log(`Set beneficiary to: `, owner.address);

  await lending
    ._setPlatformReserveFactor(parseEther("0.1"))
    .then((tx) => tx.wait()); // 10%
  console.log(`Set platform reserve factor`);
  await lending
    ._setPlatformReserveExecutionPoint(parseEther("1000"))
    .then((tx) => tx.wait());
  console.log(`Set platform reserve execution point `);

  await lending
    ._setPoolReserveFactor(parseEther("0.1"))
    .then((tx) => tx.wait()); // 10%
  console.log(`Set pool reserve factor`);
  await lending
    ._setPoolReserveExecutionPoint(parseEther("1000"))
    .then((tx) => tx.wait());
  console.log(`Set pool reserve execution point`);

  const adminProject = AdminProject__factory.connect(
    addressList["AdminProject"],
    owner
  );
  await adminProject.addSuperAdmin(lending.address, projectName);
};

export const setupLendings = async () => {
  await setupLending("KUB");
  await setupLending("KBTC");
  await setupLending("KETH");
  await setupLending("KUSDT");
  await setupLending("KUSDC");
  await setupLending("KDAI");
};
