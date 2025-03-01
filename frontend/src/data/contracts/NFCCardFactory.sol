// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./NFCLuxuryMarketplace.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFCCardFactory
 * @dev Factory contract to manage NFC card deployment and linking
 */
contract NFCCardFactory is Ownable {
    // Reference to the marketplace contract
    NFCLuxuryMarketplace public marketplace;

    // Mapping to track existing NFC card URLs
    mapping(string => bool) private _registeredUrls;

    // Mapping to track tokenIds for URLs
    mapping(string => uint256) private _urlToTokenId;

    // Events
    event NFCCardRegistered(string nfcUrl, uint256 tokenId, address owner);

    constructor(address marketplaceAddress) {
        marketplace = NFCLuxuryMarketplace(marketplaceAddress);
    }

    /**
     * @dev Register a new NFC card with a unique URL
     * @param nfcUrl URL that the NFC card will redirect to
     * @param owner Address that will own this NFC card
     * @param metadataBase Base metadata for the token (will be combined with tokenId)
     * @return tokenId The newly minted token's ID
     */
    function registerNFCCard(string memory nfcUrl, address owner, string memory metadataBase)
        public
        onlyOwner
        returns (uint256)
    {
        require(!_registeredUrls[nfcUrl], "This URL is already registered");

        // Generate tokenURI from the metadataBase and nfcUrl
        string memory tokenURI = string(abi.encodePacked(metadataBase, nfcUrl));

        // Mint the token in the marketplace contract
        uint256 tokenId = marketplace.mintNFCCard(owner, tokenURI);

        // Register the URL
        _registeredUrls[nfcUrl] = true;
        _urlToTokenId[nfcUrl] = tokenId;

        emit NFCCardRegistered(nfcUrl, tokenId, owner);

        return tokenId;
    }

    /**
     * @dev Check if an NFC URL is registered
     * @param nfcUrl URL to check
     * @return isRegistered Whether the URL is registered
     * @return tokenId The token ID associated with this URL (0 if not registered)
     */
    function checkNFCUrl(string memory nfcUrl) public view returns (bool isRegistered, uint256 tokenId) {
        isRegistered = _registeredUrls[nfcUrl];
        tokenId = _urlToTokenId[nfcUrl];
        return (isRegistered, tokenId);
    }

    /**
     * @dev Update the marketplace contract address
     * @param newMarketplace Address of the new marketplace contract
     */
    function updateMarketplace(address newMarketplace) public onlyOwner {
        marketplace = NFCLuxuryMarketplace(newMarketplace);
    }
}
