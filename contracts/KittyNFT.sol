// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract KittyNFT is ERC721 {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address public owner;
  
    constructor() ERC721("KittyNFT", "KTTY") {
    }

    //function mint(string memory tokenURI) public returns (uint256){
    function mint() public returns (uint256){
        uint256 newItemId = _tokenIds.current();
        //_setTokenURI(newItemId, tokenURI);
        _tokenIds.increment();
        return newItemId;
    }

    function awardItem(address player, uint256 tokenId) public {
        _mint(player, tokenId);
    }

}