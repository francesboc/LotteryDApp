const KittyNFT = artifacts.require("KittyNFT")
const TryFactory = artifacts.require("TryFactory")

module.exports = async (deployer, network, accounts) => {
  let tryFactoryDeploy = await deployer.deploy(TryFactory);
  let tryFactoryDeployed = await TryFactory.deployed();
  let kittyDeploy = await deployer.deploy(KittyNFT,TryFactory.address);
  await tryFactoryDeployed.setKittyNFTAddress(KittyNFT.address)
  await tryFactoryDeployed.createNewLottery(5,1,10,{gas: 6000000});
  //var newLotteryAddr = await tryFactoryDeployed.getLottteryAddr();
  //await tryFactoryDeployed.setLotteryAddr(newLotteryAddr);
};