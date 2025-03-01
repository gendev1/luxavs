// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./INFCLuxuryMarketplace.sol";

/**
 * @title NFCLuxuryMarketplace
 * @dev Smart contract for managing luxury goods marketplace linked to NFC cards
 * Implements INFCLuxuryMarketplace interface for integration with CollectibleRegistry
 */
contract NFCLuxuryMarketplace is
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard,
    Initializable,
    INFCLuxuryMarketplace
{
    using Counters for Counters.Counter;

    // Custom Errors
    error TokenDoesNotExist(uint256 tokenId);
    error NotTheTokenOwner(uint256 tokenId, address caller);
    error ItemNotListed(uint256 tokenId);
    error NoBuyRequest(uint256 tokenId, address buyer);
    error AlreadyRequested(uint256 tokenId, address buyer);
    error InsufficientPayment(uint256 required, uint256 provided);
    error NotAuthorized();
    error ZeroAddress();
    error AlreadyInitialized();
    error WithdrawalFailed();
    error PriceIncreaseTooSmall(uint256 current, uint256 minimum);
    error CannotBuyOwnItem();

    Counters.Counter private _tokenIds;

    // Structure for luxury item listings
    struct Item {
        address owner;
        string metadataURI; // IPFS hash pointing to item metadata and report
        uint256 price;
        bool isListed;
        address[] buyRequests;
    }

    // Mapping from tokenId to Item
    mapping(uint256 => Item) private _items;

    // Separate mapping for buy request prices to avoid nested mappings in structs
    mapping(uint256 => mapping(address => uint256)) private _requestPrices;

    // Mapping to efficiently check if a buyer has already made a request
    mapping(uint256 => mapping(address => bool)) private _hasBuyRequest;

    // Mapping to track collectible IDs associated with tokens
    mapping(uint256 => uint256) private _tokenToCollectibleId;

    // Address of the CollectibleRegistry contract
    address private _registryAddress;

    // Mapping of authorized minters
    mapping(address => bool) private _authorizedMinters;

    // Balances for sellers after sales
    mapping(address => uint256) private _sellerBalances;

    // Events
    event NFCCardMinted(uint256 tokenId, address owner, string tokenURI);
    event ItemListed(uint256 tokenId, string metadataURI, uint256 price);
    event BuyRequested(uint256 tokenId, address buyer, uint256 price);
    event SaleApproved(uint256 tokenId, address seller, address buyer, uint256 price);
    event TokenMetadataUpdated(uint256 tokenId, string newTokenURI);
    event MinterAdded(address minter);
    event MinterRemoved(address minter);
    event RegistryUpdated(address registry);
    event BalanceWithdrawn(address seller, uint256 amount);
    event CollectibleLinked(uint256 tokenId, uint256 collectibleId);

    constructor() ERC721("NFCLuxuryMarketplace", "NFCLUX") {}

    /**
     * @dev Initializes the contract (used with proxy pattern)
     */
    function initialize(address admin, address registryAddress) external initializer {
        if (admin == address(0)) revert ZeroAddress();

        // Manual initialization instead of calling __ERC721_init
        // The ERC721 was already initialized in the constructor
        _transferOwnership(admin);
        _registryAddress = registryAddress;
    }

    // Modifiers

    /**
     * @dev Modifier to check if the sender is an authorized minter
     */
    modifier onlyAuthorizedMinter() {
        if (
            !(
                msg.sender == owner() || _authorizedMinters[msg.sender]
                    || msg.sender == _registryAddress
            )
        ) {
            revert NotAuthorized();
        }
        _;
    }

    // Admin functions

    /**
     * @dev Set the CollectibleRegistry address
     * @param registryAddress Address of the CollectibleRegistry contract
     */
    function setRegistryAddress(
        address registryAddress
    ) external onlyOwner {
        if (registryAddress == address(0)) revert ZeroAddress();
        _registryAddress = registryAddress;
        emit RegistryUpdated(registryAddress);
    }

    /**
     * @dev Add an authorized minter
     * @param minter Address to authorize for minting
     */
    function addMinter(
        address minter
    ) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        _authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove an authorized minter
     * @param minter Address to remove from authorized minters
     */
    function removeMinter(
        address minter
    ) external onlyOwner {
        _authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @dev Link token with collectible ID
     * @param tokenId Token ID to link
     * @param collectibleId Collectible ID to link
     */
    function linkCollectible(
        uint256 tokenId,
        uint256 collectibleId
    ) external onlyAuthorizedMinter {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        _tokenToCollectibleId[tokenId] = collectibleId;
        emit CollectibleLinked(tokenId, collectibleId);
    }

    /**
     * @dev Mint a new NFC card
     * Implementation of INFCLuxuryMarketplace.mintNFCCard
     * @param to Address to mint the card to
     * @param tokenURI URI pointing to the NFC card metadata
     * @return newTokenId The ID of the newly minted token
     */
    function mintNFCCard(
        address to,
        string memory tokenURI
    ) public override onlyAuthorizedMinter returns (uint256) {
        if (to == address(0)) revert ZeroAddress();

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
     * Implementation of INFCLuxuryMarketplace.updateTokenMetadata
     * @param tokenId ID of the token to update
     * @param newTokenURI New URI for the token metadata
     */
    function updateTokenMetadata(uint256 tokenId, string memory newTokenURI) public override {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);

        if (
            !(
                ownerOf(tokenId) == msg.sender || msg.sender == owner()
                    || _authorizedMinters[msg.sender] || msg.sender == _registryAddress
            )
        ) {
            revert NotAuthorized();
        }

        _setTokenURI(tokenId, newTokenURI);
        emit TokenMetadataUpdated(tokenId, newTokenURI);
    }

    /**
     * @dev Create or update a listing for a luxury item
     * Implementation of INFCLuxuryMarketplace.createOrUpdateListing
     * @param tokenId ID of the NFC card token
     * @param metadataURI IPFS URI pointing to item metadata and analysis report
     * @param price Listing price for the item
     */
    function createOrUpdateListing(
        uint256 tokenId,
        string memory metadataURI,
        uint256 price
    ) public override {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTheTokenOwner(tokenId, msg.sender);

        Item storage item = _items[tokenId];
        item.metadataURI = metadataURI;
        item.price = price;
        item.isListed = true;
        item.owner = msg.sender;

        // Clear previous buy requests when updating
        for (uint256 i = 0; i < item.buyRequests.length; i++) {
            address requester = item.buyRequests[i];
            delete _requestPrices[tokenId][requester];
            delete _hasBuyRequest[tokenId][requester];
        }
        delete item.buyRequests;

        emit ItemListed(tokenId, metadataURI, price);
    }

    /**
     * @dev Request to buy a listed item
     * @param tokenId ID of the NFC card token
     * @param offerPrice Price offered for the item
     */
    function requestToBuy(uint256 tokenId, uint256 offerPrice) public payable nonReentrant {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        if (!_items[tokenId].isListed) revert ItemNotListed(tokenId);
        if (msg.sender == _items[tokenId].owner) revert CannotBuyOwnItem();

        Item storage item = _items[tokenId];

        // Check for minimum offer price
        if (offerPrice < item.price) revert InsufficientPayment(item.price, offerPrice);

        // If buyer already has a request, require a minimum price increase
        if (_hasBuyRequest[tokenId][msg.sender]) {
            uint256 currentOffer = _requestPrices[tokenId][msg.sender];
            uint256 minIncrease = (currentOffer * 105) / 100; // 5% increase

            if (offerPrice < minIncrease) {
                revert PriceIncreaseTooSmall(offerPrice, minIncrease);
            }
        }

        // Require at least 10% of offer price as deposit
        uint256 requiredDeposit = offerPrice / 10;
        if (msg.value < requiredDeposit) {
            revert InsufficientPayment(requiredDeposit, msg.value);
        }

        // Add buyer to request list if not already there
        if (!_hasBuyRequest[tokenId][msg.sender]) {
            item.buyRequests.push(msg.sender);
            _hasBuyRequest[tokenId][msg.sender] = true;
        }

        // Store offer price
        _requestPrices[tokenId][msg.sender] = offerPrice;

        emit BuyRequested(tokenId, msg.sender, offerPrice);
    }

    /**
     * @dev Approve a buy request
     * @param tokenId ID of the NFC card token
     * @param buyer Address of the buyer whose request is being approved
     */
    function approveSale(uint256 tokenId, address buyer) public nonReentrant {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTheTokenOwner(tokenId, msg.sender);

        Item storage item = _items[tokenId];
        if (!item.isListed) revert ItemNotListed(tokenId);
        if (!_hasBuyRequest[tokenId][buyer]) revert NoBuyRequest(tokenId, buyer);

        uint256 salePrice = _requestPrices[tokenId][buyer];
        address seller = msg.sender;

        // Update seller's balance
        _sellerBalances[seller] += salePrice;

        // Update state BEFORE transfer
        item.owner = buyer;
        item.isListed = false;

        // Clear all buy requests and associated data
        for (uint256 i = 0; i < item.buyRequests.length; i++) {
            address requester = item.buyRequests[i];
            delete _requestPrices[tokenId][requester];
            delete _hasBuyRequest[tokenId][requester];
        }
        delete item.buyRequests;

        // Transfer ownership AFTER state updates
        _transfer(seller, buyer, tokenId);

        // Sync with CollectibleRegistry if this token is linked to a collectible
        uint256 collectibleId = _tokenToCollectibleId[tokenId];
        if (collectibleId > 0 && _registryAddress != address(0)) {
            // Use try-catch to prevent failure if registry call fails
            try ICollectibleRegistry(_registryAddress).syncOwnership(collectibleId, buyer) {
                // Successfully synced ownership
            } catch {
                // Registry call failed, but we still proceed with the sale
                // Could log event here for monitoring
            }
        }

        emit SaleApproved(tokenId, seller, buyer, salePrice);
    }

    /**
     * @dev Withdraw seller balance
     */
    function withdrawBalance() external nonReentrant {
        uint256 amount = _sellerBalances[msg.sender];
        if (amount == 0) revert InsufficientPayment(1, 0);

        // Set balance to 0 before transfer
        _sellerBalances[msg.sender] = 0;

        // Transfer funds
        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert WithdrawalFailed();

        emit BalanceWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Get item metadata
     * Implementation of INFCLuxuryMarketplace.getItemDetails
     * @param tokenId ID of the NFC card token
     * @return metadataURI IPFS URI of item metadata
     * @return price Listing price
     * @return isListed Whether the item is listed
     * @return owner Owner address
     */
    function getItemDetails(
        uint256 tokenId
    )
        public
        view
        override
        returns (string memory metadataURI, uint256 price, bool isListed, address owner)
    {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);

        Item storage item = _items[tokenId];
        return (item.metadataURI, item.price, item.isListed, item.owner);
    }

    /**
     * @dev Get buy requests for an item
     * @param tokenId ID of the NFC card token
     * @return buyers Array of addresses that have requested to buy
     * @return prices Array of offer prices (in the same order as buyers)
     */
    function getBuyRequests(
        uint256 tokenId
    ) public view returns (address[] memory buyers, uint256[] memory prices) {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTheTokenOwner(tokenId, msg.sender);

        Item storage item = _items[tokenId];
        buyers = item.buyRequests;
        prices = new uint256[](buyers.length);

        for (uint256 i = 0; i < buyers.length; i++) {
            prices[i] = _requestPrices[tokenId][buyers[i]];
        }

        return (buyers, prices);
    }

    /**
     * @dev Get the collectible ID linked to a token
     * @param tokenId Token ID to check
     * @return collectibleId The linked collectible ID, or 0 if none
     */
    function getLinkedCollectible(
        uint256 tokenId
    ) public view returns (uint256 collectibleId) {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        return _tokenToCollectibleId[tokenId];
    }

    /**
     * @dev Check if an address is an authorized minter
     * @param minter Address to check
     * @return Boolean indicating if the address is an authorized minter
     */
    function isAuthorizedMinter(
        address minter
    ) public view returns (bool) {
        return minter == owner() || _authorizedMinters[minter] || minter == _registryAddress;
    }

    /**
     * @dev Get the registry address
     * @return Address of the CollectibleRegistry contract
     */
    function getRegistryAddress() public view returns (address) {
        return _registryAddress;
    }

    /**
     * @dev Get the seller's balance
     * @param seller Address of the seller
     * @return Balance available for withdrawal
     */
    function getSellerBalance(
        address seller
    ) public view returns (uint256) {
        return _sellerBalances[seller];
    }
}

// Interface for CollectibleRegistry to sync ownership
interface ICollectibleRegistry {
    function syncOwnership(uint256 collectibleId, address newOwner) external;
}
