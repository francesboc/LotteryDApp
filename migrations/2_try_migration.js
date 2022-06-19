const Try = artifacts.require("Try");

module.exports = function (deployer) {
    deployer.deploy(Try,5,1)
};
  