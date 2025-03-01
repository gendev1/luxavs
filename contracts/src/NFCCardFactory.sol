// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./INFCLuxuryMarketplace.sol";
import "./CollectibleRegistry.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFCCardFactory
 * @dev Factory contract to manage NFC card deployment and linking to authenticated collectibles
 */
contract NFCCardFactory is AccessControl, Initializable, ReentrancyGuard {
    // Custom errors
    error ZeroAddress();
    error NotAuthorized();
    error URLAlreadyRegistered(string nfcUrl);
    error NoCollectibleForURL(string nfcUrl);
    error CollectibleNotAuthenticated(uint256 collectibleId);
    error NoTokenForURL(string nfcUrl);
    error NoURLForCollectible(uint256 collectibleId);

    // External contract references
    INFCLuxuryMarketplace public marketplace;
    CollectibleRegistry public registry;

    // Role constants
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Mapping to track existing NFC card URLs
    mapping(string => bool) private _registeredUrls;

    // Mapping to track tokenIds for URLs
    mapping(string => uint256) private _urlToTokenId;

    // Mapping to track collectible IDs to NFC URLs
    mapping(uint256 => string) private _collectibleToUrl;

    // Mapping to track NFC URLs to collectible IDs
    mapping(string => uint256) private _urlToCollectible;

    // Events
    event NFCCardRegistered(string nfcUrl, uint256 tokenId, address owner, uint256 collectibleId);
    event NFCLinkUpdated(string nfcUrl, uint256 collectibleId);
    event ContractReferencesUpdated(address marketplaceAddress, address registryAddress);

    /**
     * @dev Constructor to set up roles and contract references
     */
    constructor(address marketplaceAddress, address registryAddress) {
        if (marketplaceAddress == address(0) || registryAddress == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        marketplace = INFCLuxuryMarketplace(marketplaceAddress);
        registry = CollectibleRegistry(registryAddress);
    }

    /**
     * @dev Initialize function for proxy pattern
     */
    function initialize(
        address admin,
        address marketplaceAddress,
        address registryAddress
    ) external initializer {
        if (
            admin == address(0) || marketplaceAddress == address(0) || registryAddress == address(0)
        ) {
            revert ZeroAddress();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);

        marketplace = INFCLuxuryMarketplace(marketplaceAddress);
        registry = CollectibleRegistry(registryAddress);
    }

    /**
     * @dev Update contract references
     */
    function updateContractReferences(
        address marketplaceAddress,
        address registryAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (marketplaceAddress == address(0) || registryAddress == address(0)) revert ZeroAddress();

        marketplace = INFCLuxuryMarketplace(marketplaceAddress);
        registry = CollectibleRegistry(registryAddress);

        emit ContractReferencesUpdated(marketplaceAddress, registryAddress);
    }

    /**
     * @dev Add a new minter
     */
    function addMinter(
        address minter
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minter == address(0)) revert ZeroAddress();
        grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Remove a minter
     */
    function removeMinter(
        address minter
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Register a new NFC card for an authenticated collectible
     * @param nfcUrl URL that the NFC card will redirect to
     * @param collectibleId ID of the authenticated collectible
     * @param metadataBase Base metadata for the token (will be combined with tokenId)
     * @return tokenId The newly minted token's ID
     */
    function registerNFCCard(
        string memory nfcUrl,
        uint256 collectibleId,
        string memory metadataBase
    ) public nonReentrant onlyRole(MINTER_ROLE) returns (uint256) {
        if (bytes(nfcUrl).length == 0 || bytes(metadataBase).length == 0) revert ZeroAddress();
        if (_registeredUrls[nfcUrl]) revert URLAlreadyRegistered(nfcUrl);

        // Get collectible details from registry
        (
            address owner,
            string memory ipfsImageHash,
            string memory ipfsDocumentationHash,
            string memory ipfsMetadataHash,
            uint8 itemType,
            uint256 timestamp,
            CollectibleRegistry.AuthenticationStatus status,
            uint256 nftTokenId,
            string[] memory provenanceUpdates
        ) = registry.getCollectible(collectibleId);

        // Verify collectible is authenticated
        if (status != CollectibleRegistry.AuthenticationStatus.Authenticated) {
            revert CollectibleNotAuthenticated(collectibleId);
        }

        // Check if NFT is already minted for this collectible
        uint256 tokenId;
        if (nftTokenId == 0) {
            // Generate tokenURI from the metadataBase and collectible metadata
            string memory tokenURI =
                string(abi.encodePacked(metadataBase, "/", ipfsMetadataHash, "/", nfcUrl));

            // Mint the token in the marketplace contract
            tokenId = marketplace.mintNFCCard(owner, tokenURI);
        } else {
            // Use existing NFT
            tokenId = nftTokenId;

            // Update the token metadata to include NFC URL
            string memory newTokenURI =
                string(abi.encodePacked(metadataBase, "/", ipfsMetadataHash, "/", nfcUrl));

            marketplace.updateTokenMetadata(tokenId, newTokenURI);
        }

        // Register the URL and create mappings
        _registeredUrls[nfcUrl] = true;
        _urlToTokenId[nfcUrl] = tokenId;
        _collectibleToUrl[collectibleId] = nfcUrl;
        _urlToCollectible[nfcUrl] = collectibleId;

        // Try to link NFT to collectible in the marketplace if supported
        try INFTCollectibleLinking(address(marketplace)).linkCollectible(tokenId, collectibleId) {
            // Successfully linked in marketplace
        } catch {
            // Linking not supported or failed, but we continue
        }

        emit NFCCardRegistered(nfcUrl, tokenId, owner, collectibleId);

        return tokenId;
    }

    /**
     * @dev Update the NFC URL for an existing collectible
     * @param collectibleId ID of the authenticated collectible
     * @param newNfcUrl New NFC URL to associate with this collectible
     */
    function updateNFCUrl(
        uint256 collectibleId,
        string memory newNfcUrl
    ) public nonReentrant onlyRole(MINTER_ROLE) {
        if (bytes(newNfcUrl).length == 0) revert ZeroAddress();
        if (_registeredUrls[newNfcUrl]) revert URLAlreadyRegistered(newNfcUrl);

        // Get current URL for collectible
        string memory oldNfcUrl = _collectibleToUrl[collectibleId];
        if (bytes(oldNfcUrl).length == 0) revert NoURLForCollectible(collectibleId);

        // Get token ID
        uint256 tokenId = _urlToTokenId[oldNfcUrl];
        if (tokenId == 0) revert NoTokenForURL(oldNfcUrl);

        // Update mappings - keep track of old values to revert if needed
        bool oldRegistration = _registeredUrls[oldNfcUrl];
        uint256 oldTokenId = _urlToTokenId[oldNfcUrl];
        uint256 oldCollectibleId = _urlToCollectible[oldNfcUrl];

        // Update mappings
        _registeredUrls[oldNfcUrl] = false;
        _registeredUrls[newNfcUrl] = true;
        _urlToTokenId[newNfcUrl] = tokenId;
        _urlToTokenId[oldNfcUrl] = 0;
        _collectibleToUrl[collectibleId] = newNfcUrl;
        _urlToCollectible[newNfcUrl] = collectibleId;
        _urlToCollectible[oldNfcUrl] = 0;

        // Get collectible details for metadata update
        try registry.getCollectible(collectibleId) returns (
            address owner,
            string memory ipfsImageHash,
            string memory ipfsDocumentationHash,
            string memory ipfsMetadataHash,
            uint8 itemType,
            uint256 timestamp,
            CollectibleRegistry.AuthenticationStatus status,
            uint256 nftTokenId,
            string[] memory provenanceUpdates
        ) {
            // Update token metadata
            string memory newTokenURI =
                string(abi.encodePacked("ipfs://", ipfsMetadataHash, "/", newNfcUrl));

            try marketplace.updateTokenMetadata(tokenId, newTokenURI) {
                // Successfully updated token URI
                emit NFCLinkUpdated(newNfcUrl, collectibleId);
            } catch {
                // Revert mappings if token update fails
                _registeredUrls[oldNfcUrl] = oldRegistration;
                _registeredUrls[newNfcUrl] = false;
                _urlToTokenId[oldNfcUrl] = oldTokenId;
                _urlToTokenId[newNfcUrl] = 0;
                _collectibleToUrl[collectibleId] = oldNfcUrl;
                _urlToCollectible[oldNfcUrl] = oldCollectibleId;
                _urlToCollectible[newNfcUrl] = 0;

                revert NotAuthorized();
            }
        } catch {
            // Revert mappings if registry call fails
            _registeredUrls[oldNfcUrl] = oldRegistration;
            _registeredUrls[newNfcUrl] = false;
            _urlToTokenId[oldNfcUrl] = oldTokenId;
            _urlToTokenId[newNfcUrl] = 0;
            _collectibleToUrl[collectibleId] = oldNfcUrl;
            _urlToCollectible[oldNfcUrl] = oldCollectibleId;
            _urlToCollectible[newNfcUrl] = 0;

            revert CollectibleNotAuthenticated(collectibleId);
        }
    }

    /**
     * @dev Check if an NFC URL is registered
     * @param nfcUrl URL to check
     * @return isRegistered Whether the URL is registered
     * @return tokenId The token ID associated with this URL
     * @return collectibleId The collectible ID associated with this URL
     */
    function checkNFCUrl(
        string memory nfcUrl
    ) public view returns (bool isRegistered, uint256 tokenId, uint256 collectibleId) {
        isRegistered = _registeredUrls[nfcUrl];
        tokenId = _urlToTokenId[nfcUrl];
        collectibleId = _urlToCollectible[nfcUrl];
        return (isRegistered, tokenId, collectibleId);
    }

    /**
     * @dev Get the NFC URL for a collectible
     * @param collectibleId ID of the collectible
     * @return nfcUrl The NFC URL associated with this collectible
     * @return tokenId The token ID associated with this collectible
     */
    function getNFCForCollectible(
        uint256 collectibleId
    ) public view returns (string memory nfcUrl, uint256 tokenId) {
        nfcUrl = _collectibleToUrl[collectibleId];
        if (bytes(nfcUrl).length == 0) revert NoURLForCollectible(collectibleId);

        tokenId = _urlToTokenId[nfcUrl];
        if (tokenId == 0) revert NoTokenForURL(nfcUrl);

        return (nfcUrl, tokenId);
    }
}
