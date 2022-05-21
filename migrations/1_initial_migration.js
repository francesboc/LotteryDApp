const Migrations = artifacts.require("Migrations");
// const NFT = artifacts.require("KittyNFT");
const Try = artifacts.require("Try");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  // deployer.deploy(NFT);
  deployer.deploy(Try)
};
