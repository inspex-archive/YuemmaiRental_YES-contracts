import { deployYESToken } from "./deploy-yes-token";
import { deployController } from "./deploy-controller";
import { deployInterest } from "./deploy-interest";
import { deployKUBLending } from "./deploy-kublending";
import { deployMarketImpl } from "./deploy-marketImpl";
import { deployOracle } from "./deploy-oracle";
import { deployVault } from "./deploy-vault";
import { setupController } from "./setup-controller";
import { setupLendings } from "./setup-lendings";
import { deployKAP20Lending } from "./deploy-kap20lending";
import { setupProjectAdmin } from "./setup-project-admin";
import { addSwapLiquidity } from "./add-swap-liquidity";
import { setupYESVault } from "./setup-yes-vault";
import { updateOracle } from "./update-oracle";
import { setupCallHelper } from "./setup-callhelper";
import { deployBorrowLimit } from "./deploy-borrow-limit";

const deployLendingContracts = async () => {
  await deployKAP20Lending('KBTC');
  await deployKAP20Lending('KETH');
  await deployKAP20Lending('KDAI');
  await deployKAP20Lending('KUSDC');
  await deployKAP20Lending('KUSDT');
  await deployKUBLending();
}

async function main() {
  // await setupProjectAdmin('yuemmai');

  await deployBorrowLimit();
  await deployController();
  await deployYESToken();

  await deployOracle();

  await deployInterest();
  await deployMarketImpl();

  await deployVault();

  await deployLendingContracts();

  await addSwapLiquidity();
  await updateOracle();

  await setupController();
  await setupYESVault();
  await setupLendings();

  // await setupCallHelper();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
