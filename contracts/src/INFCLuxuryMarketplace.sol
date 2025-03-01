// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title INFCLuxuryMarketplace
 * @dev Interface for the NFCLuxuryMarketplace contract to enable integration
 * with the CollectibleRegistry
 */
interface INFCLuxuryMarketplace {
    /**
     * @dev Mint a new NFC card (NFT)
     * @param to Address to mint the card to
     * @param tokenURI URI pointing to the NFC card metadata
     * @return newTokenId The ID of the newly minted token
     */
    function mintNFCCard(address to, string memory tokenURI) external returns (uint256);

    /**
     * @dev Update the token metadata URI
     * @param tokenId ID of the token to update
     * @param newTokenURI New URI for the token metadata
     */
    function updateTokenMetadata(uint256 tokenId, string memory newTokenURI) external;

    /**
     * @dev Create or update a listing for a luxury item
     * @param tokenId ID of the NFC card token
     * @param metadataURI IPFS URI pointing to item metadata and analysis report
     * @param price Listing price for the item
     */
    function createOrUpdateListing(
        uint256 tokenId,
        string memory metadataURI,
        uint256 price
    ) external;

    /**
     * @dev Get item metadata
     * @param tokenId ID of the NFC card token
     * @return metadataURI IPFS URI of item metadata
     * @return price Listing price
     * @return isListed Whether the item is listed
     * @return owner Owner address
     */
    function getItemDetails(
        uint256 tokenId
    )
        external
        view
        returns (string memory metadataURI, uint256 price, bool isListed, address owner);
}
