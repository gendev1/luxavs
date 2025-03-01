// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFCLuxuryMarketplace
 * @dev Smart contract for managing luxury goods marketplace linked to NFC cards
 */
contract NFCLuxuryMarketplace is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    // Structure for luxury item listings
    struct Item {
        address owner;
        string metadataURI; // IPFS hash pointing to item metadata and report
        uint256 price;
        bool isListed;
        address[] buyRequests;
        mapping(address => uint256) requestPrices;
    }

    // Mapping from tokenId to Item
    mapping(uint256 => Item) private _items;

    // Events
    event NFCCardMinted(uint256 tokenId, address owner, string tokenURI);
    event ItemListed(uint256 tokenId, string metadataURI, uint256 price);
    event BuyRequested(uint256 tokenId, address buyer, uint256 price);
    event SaleApproved(uint256 tokenId, address seller, address buyer, uint256 price);
    event TokenMetadataUpdated(uint256 tokenId, string newTokenURI);

    constructor() ERC721("NFCLuxuryMarketplace", "NFCLUX") {}

    /**
     * @dev Mint a new NFC card
     * @param to Address to mint the card to
     * @param tokenURI URI pointing to the NFC card metadata
     * @return newTokenId The ID of the newly minted token
     */
    function mintNFCCard(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        // Initialize empty item for this token
        _items[newTokenId].owner = to;
        _items[newTokenId].isListed = false;

        emit NFCCardMinted(newTokenId, to, tokenURI);
        return newTokenId;
    }

    /**
     * @dev Update the base token metadata URI
     * @param tokenId ID of the token to update
     * @param newTokenURI New URI for the token metadata
     */
    function updateTokenMetadata(uint256 tokenId, string memory newTokenURI) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this token");

        _setTokenURI(tokenId, newTokenURI);

        emit TokenMetadataUpdated(tokenId, newTokenURI);
    }

    /**
     * @dev Create or update a listing for a luxury item
     * @param tokenId ID of the NFC card token
     * @param metadataURI IPFS URI pointing to item metadata and analysis report
     * @param price Listing price for the item
     */
    function createOrUpdateListing(uint256 tokenId, string memory metadataURI, uint256 price) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this token");

        Item storage item = _items[tokenId];
        item.metadataURI = metadataURI;
        item.price = price;
        item.isListed = true;
        item.owner = msg.sender;

        // Clear previous buy requests when updating
        delete item.buyRequests;

        emit ItemListed(tokenId, metadataURI, price);
    }

    /**
     * @dev Request to buy a listed item
     * @param tokenId ID of the NFC card token
     * @param offerPrice Price offered for the item
     */
    function requestToBuy(uint256 tokenId, uint256 offerPrice) public {
        require(_exists(tokenId), "Token does not exist");
        require(_items[tokenId].isListed, "Item is not listed for sale");
        require(msg.sender != _items[tokenId].owner, "Owner cannot buy their own item");

        Item storage item = _items[tokenId];

        // Check if buyer already has a request
        bool requestExists = false;
        for (uint256 i = 0; i < item.buyRequests.length; i++) {
            if (item.buyRequests[i] == msg.sender) {
                requestExists = true;
                break;
            }
        }

        if (!requestExists) {
            item.buyRequests.push(msg.sender);
        }

        item.requestPrices[msg.sender] = offerPrice;

        emit BuyRequested(tokenId, msg.sender, offerPrice);
    }

    /**
     * @dev Approve a buy request
     * @param tokenId ID of the NFC card token
     * @param buyer Address of the buyer whose request is being approved
     */
    function approveSale(uint256 tokenId, address buyer) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this token");

        Item storage item = _items[tokenId];
        require(item.isListed, "Item is not listed for sale");

        bool validBuyer = false;
        for (uint256 i = 0; i < item.buyRequests.length; i++) {
            if (item.buyRequests[i] == buyer) {
                validBuyer = true;
                break;
            }
        }
        require(validBuyer, "No buy request from this buyer");

        uint256 salePrice = item.requestPrices[buyer];

        // Transfer ownership
        _transfer(msg.sender, buyer, tokenId);

        // Update item
        item.owner = buyer;
        item.isListed = false;
        delete item.buyRequests;

        emit SaleApproved(tokenId, msg.sender, buyer, salePrice);
    }

    /**
     * @dev Get item metadata
     * @param tokenId ID of the NFC card token
     * @return metadataURI IPFS URI of item metadata
     * @return price Listing price
     * @return isListed Whether the item is listed
     * @return owner Owner address
     */
    function getItemDetails(uint256 tokenId)
        public
        view
        returns (string memory metadataURI, uint256 price, bool isListed, address owner)
    {
        require(_exists(tokenId), "Token does not exist");

        Item storage item = _items[tokenId];
        return (item.metadataURI, item.price, item.isListed, item.owner);
    }

    /**
     * @dev Get buy requests for an item
     * @param tokenId ID of the NFC card token
     * @return buyers Array of addresses that have requested to buy
     * @return prices Array of offer prices (in the same order as buyers)
     */
    function getBuyRequests(uint256 tokenId) public view returns (address[] memory buyers, uint256[] memory prices) {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this token");

        Item storage item = _items[tokenId];
        buyers = item.buyRequests;
        prices = new uint256[](buyers.length);

        for (uint256 i = 0; i < buyers.length; i++) {
            prices[i] = item.requestPrices[buyers[i]];
        }

        return (buyers, prices);
    }
}
