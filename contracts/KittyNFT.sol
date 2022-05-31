// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract KittyNFT is ERC721 {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Owner of NFT
    address public owner;
    // Lottery address
    address public lottery;
    // Mapping from classes to tokenId
    mapping(uint => uint) public classes;
    // Mapping from tokeId to descriptions
    mapping(uint => string) public descriptions;

    constructor(address operator) ERC721("KittyNFT", "KTTY") {
        owner = operator;
        lottery = msg.sender;
        _setApprovalForAll(owner, lottery, true);
    }

    //function mint(string memory tokenURI) public returns (uint256){
    function mint(uint class) public returns (uint256){
        uint256 newItemId = _tokenIds.current();

        _tokenIds.increment();
        _safeMint(owner, newItemId);

        classes[class] = newItemId;
        descriptions[newItemId] = string(abi.encodePacked("NFT of class: ", Strings.toString(class)));

        return newItemId;
    }

    function getTokenFromClass(uint class) public view returns(uint){
        return classes[class];
    }

    function awardItem(address player, uint256 tokenId) public {
        require(msg.sender == lottery, "Only the lottery can award tokens.");
        safeTransferFrom(owner, player, tokenId);
    }

}