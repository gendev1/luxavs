// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ILuxServiceManager.sol";
import "./INFCLuxuryMarketplace.sol";

/**
 * @title CollectibleRegistry
 * @dev Central contract that coordinates the authentication and NFT minting process
 * for collectible items. Acts as the hub between various system components.
 */
contract CollectibleRegistry is AccessControl, Initializable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Custom errors
    error ZeroAddress();
    error NotAuthorized();
    error InvalidState(uint256 itemId, AuthenticationStatus currentStatus);
    error ImageAlreadyRegistered(string ipfsImageHash);
    error ItemDoesNotExist(uint256 itemId);
    error TaskNotMapped(uint32 taskId);
    error NFTAlreadyMinted(uint256 itemId);
    error NftMintingFailed(uint256 itemId);

    // Roles
    bytes32 public constant AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    // External contract references
    ILuxServiceManager public serviceManager;
    INFCLuxuryMarketplace public nftMarketplace;

    // Counters
    Counters.Counter private _itemIds;

    // Collectible item structure
    struct CollectibleItem {
        uint256 itemId;
        address owner;
        string ipfsImageHash;
        string ipfsDocumentationHash;
        string ipfsMetadataHash;
        uint8 itemType;
        uint256 timestamp;
        AuthenticationStatus status;
        uint256 nftTokenId;
        string[] provenanceUpdates;
    }

    // Authentication status enum
    enum AuthenticationStatus {
        Pending,
        Authenticated,
        Rejected,
        Expired
    }

    // Mappings
    mapping(uint256 => CollectibleItem) public collectibles;
    mapping(uint32 => uint256) public taskToItemId;
    mapping(string => bool) public registeredImageHashes;

    // Events
    event CollectibleSubmitted(uint256 itemId, address owner, string ipfsImageHash);
    event AuthenticationRequested(uint256 itemId, uint32 taskId);
    event AuthenticationCompleted(uint256 itemId, AuthenticationStatus status);
    event NFTMinted(uint256 itemId, uint256 tokenId);
    event ProvenanceUpdated(uint256 itemId, string ipfsUpdateHash);
    event OwnershipTransferred(uint256 itemId, address previousOwner, address newOwner);
    event ContractReferencesUpdated(address serviceManager, address nftMarketplace);

    /**
     * @dev Constructor to set up initial roles and contract references
     */
    constructor(address _serviceManager, address _nftMarketplace) {
        if (_serviceManager == address(0) || _nftMarketplace == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        serviceManager = ILuxServiceManager(_serviceManager);
        nftMarketplace = INFCLuxuryMarketplace(_nftMarketplace);
    }

    /**
     * @dev Initializes the contract (used with proxy pattern)
     */
    function initialize(
        address admin,
        address _serviceManager,
        address _nftMarketplace
    ) external initializer {
        if (admin == address(0) || _serviceManager == address(0) || _nftMarketplace == address(0)) {
            revert ZeroAddress();
        }

        if (hasRole(DEFAULT_ADMIN_ROLE, address(0))) revert NotAuthorized();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        serviceManager = ILuxServiceManager(_serviceManager);
        nftMarketplace = INFCLuxuryMarketplace(_nftMarketplace);
    }

    /**
     * @dev Updates contract references
     */
    function updateContractReferences(
        address _serviceManager,
        address _nftMarketplace
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_serviceManager == address(0) || _nftMarketplace == address(0)) revert ZeroAddress();

        serviceManager = ILuxServiceManager(_serviceManager);
        nftMarketplace = INFCLuxuryMarketplace(_nftMarketplace);

        emit ContractReferencesUpdated(_serviceManager, _nftMarketplace);
    }

    /**
     * @dev Grant controller role to an address
     */
    function addController(
        address controller
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (controller == address(0)) revert ZeroAddress();
        grantRole(CONTROLLER_ROLE, controller);
    }

    /**
     * @dev Grant authenticator role to an address
     */
    function addAuthenticator(
        address authenticator
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (authenticator == address(0)) revert ZeroAddress();
        grantRole(AUTHENTICATOR_ROLE, authenticator);
    }

    /**
     * @dev Grant minter role to an address
     */
    function addMinter(
        address minter
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minter == address(0)) revert ZeroAddress();
        grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Submit a new collectible for authentication
     * @param ipfsImageHash IPFS hash for the collectible image
     * @param ipfsDocumentationHash IPFS hash for any supporting documentation
     * @param ipfsMetadataHash IPFS hash for item metadata
     * @param itemType Type of collectible (watch, comic, coin, etc.)
     * @return itemId The ID of the newly registered collectible
     */
    function submitCollectible(
        string memory ipfsImageHash,
        string memory ipfsDocumentationHash,
        string memory ipfsMetadataHash,
        uint8 itemType
    ) external nonReentrant returns (uint256) {
        if (bytes(ipfsImageHash).length == 0) revert ZeroAddress();
        if (registeredImageHashes[ipfsImageHash]) revert ImageAlreadyRegistered(ipfsImageHash);

        _itemIds.increment();
        uint256 newItemId = _itemIds.current();

        CollectibleItem storage item = collectibles[newItemId];
        item.itemId = newItemId;
        item.owner = msg.sender;
        item.ipfsImageHash = ipfsImageHash;
        item.ipfsDocumentationHash = ipfsDocumentationHash;
        item.ipfsMetadataHash = ipfsMetadataHash;
        item.itemType = itemType;
        item.timestamp = block.timestamp;
        item.status = AuthenticationStatus.Pending;

        registeredImageHashes[ipfsImageHash] = true;

        emit CollectibleSubmitted(newItemId, msg.sender, ipfsImageHash);

        // Request authentication immediately
        requestAuthentication(newItemId);

        return newItemId;
    }

    /**
     * @dev Initiates authentication for a collectible item through LuxServiceManager
     * @param itemId ID of the collectible to authenticate
     */
    function requestAuthentication(
        uint256 itemId
    ) public nonReentrant {
        if (!(collectibles[itemId].owner == msg.sender || hasRole(AUTHENTICATOR_ROLE, msg.sender)))
        {
            revert NotAuthorized();
        }

        CollectibleItem storage item = collectibles[itemId];
        if (item.owner == address(0)) revert ItemDoesNotExist(itemId);

        if (
            item.status != AuthenticationStatus.Pending
                && item.status != AuthenticationStatus.Rejected
        ) {
            revert InvalidState(itemId, item.status);
        }

        // Convert IPFS hash to bytes32 for serviceManager
        bytes32 imageHash = keccak256(abi.encodePacked(item.ipfsImageHash));
        bytes32 metadataHash =
            keccak256(abi.encodePacked(item.ipfsMetadataHash, item.ipfsDocumentationHash));

        // Create authentication task in LuxServiceManager
        try serviceManager.createNewTask(imageHash, metadataHash, item.itemType) returns (
            ILuxServiceManager.Task memory
        ) {
            // Get latest task number
            uint32 taskId = serviceManager.latestTaskNum() - 1;

            // Map task ID to item ID
            taskToItemId[taskId] = itemId;

            emit AuthenticationRequested(itemId, taskId);
        } catch {
            // If task creation fails, keep item in pending state
            // but don't revert to allow other operations to succeed
        }
    }

    /**
     * @dev Callback function for authentication completion
     * @param taskIndex Index of the completed task
     * @param isAuthentic Whether the item was authenticated successfully
     * @param authenticator Address of the authenticator
     */
    function onAuthenticationComplete(
        uint32 taskIndex,
        bool isAuthentic,
        address authenticator
    ) external nonReentrant {
        if (!hasRole(AUTHENTICATOR_ROLE, authenticator) && !hasRole(CONTROLLER_ROLE, authenticator))
        {
            revert NotAuthorized();
        }

        uint256 itemId = taskToItemId[taskIndex];
        if (itemId == 0) revert TaskNotMapped(taskIndex);

        CollectibleItem storage item = collectibles[itemId];
        item.status =
            isAuthentic ? AuthenticationStatus.Authenticated : AuthenticationStatus.Rejected;

        emit AuthenticationCompleted(itemId, item.status);

        // If authenticated, mint NFT
        if (isAuthentic) {
            mintNFTForCollectible(itemId);
        }
    }

    /**
     * @dev Mints an NFT for an authenticated collectible
     * @param itemId ID of the authenticated collectible
     */
    function mintNFTForCollectible(
        uint256 itemId
    ) internal {
        CollectibleItem storage item = collectibles[itemId];
        if (item.status != AuthenticationStatus.Authenticated) {
            revert InvalidState(itemId, item.status);
        }
        if (item.nftTokenId != 0) revert NFTAlreadyMinted(itemId);

        // Prepare metadata URI
        string memory metadataURI =
            string(abi.encodePacked("ipfs://", item.ipfsMetadataHash, "/", item.ipfsImageHash));

        // Mint NFT
        try nftMarketplace.mintNFCCard(item.owner, metadataURI) returns (uint256 tokenId) {
            // Update collectible with NFT token ID
            item.nftTokenId = tokenId;

            emit NFTMinted(itemId, tokenId);

            // Link the NFT and collectible in both directions if possible
            try INFTCollectibleLinking(address(nftMarketplace)).linkCollectible(tokenId, itemId) {
                // Successfully linked
            } catch {
                // Failed to link but continue
            }
        } catch {
            revert NftMintingFailed(itemId);
        }
    }

    /**
     * @dev Add provenance record to a collectible
     * @param itemId ID of the collectible
     * @param ipfsProvenanceHash IPFS hash of provenance update
     */
    function addProvenanceRecord(
        uint256 itemId,
        string memory ipfsProvenanceHash
    ) external nonReentrant {
        CollectibleItem storage item = collectibles[itemId];
        if (item.owner != msg.sender) revert NotAuthorized();
        if (item.owner == address(0)) revert ItemDoesNotExist(itemId);
        if (item.status != AuthenticationStatus.Authenticated) {
            revert InvalidState(itemId, item.status);
        }

        collectibles[itemId].provenanceUpdates.push(ipfsProvenanceHash);

        emit ProvenanceUpdated(itemId, ipfsProvenanceHash);
    }

    /**
     * @dev Get complete data for a collectible
     * @param itemId ID of the collectible
     */
    function getCollectible(
        uint256 itemId
    )
        external
        view
        returns (
            address owner,
            string memory ipfsImageHash,
            string memory ipfsDocumentationHash,
            string memory ipfsMetadataHash,
            uint8 itemType,
            uint256 timestamp,
            AuthenticationStatus status,
            uint256 nftTokenId,
            string[] memory provenanceUpdates
        )
    {
        CollectibleItem storage item = collectibles[itemId];
        if (item.owner == address(0)) revert ItemDoesNotExist(itemId);

        return (
            item.owner,
            item.ipfsImageHash,
            item.ipfsDocumentationHash,
            item.ipfsMetadataHash,
            item.itemType,
            item.timestamp,
            item.status,
            item.nftTokenId,
            item.provenanceUpdates
        );
    }

    /**
     * @dev Transfer ownership of the collectible
     * @param itemId ID of the collectible
     * @param newOwner Address of the new owner
     */
    function transferCollectible(uint256 itemId, address newOwner) external nonReentrant {
        CollectibleItem storage item = collectibles[itemId];
        if (item.owner != msg.sender) revert NotAuthorized();
        if (item.owner == address(0)) revert ItemDoesNotExist(itemId);
        if (newOwner == address(0)) revert ZeroAddress();

        address previousOwner = item.owner;
        item.owner = newOwner;

        // If NFT exists, try to transfer it as well
        if (item.nftTokenId != 0) {
            try INFTOwnershipSync(address(nftMarketplace)).syncNFTOwner(item.nftTokenId, newOwner) {
                // Successfully synced NFT ownership
            } catch {
                // Failed to sync NFT ownership but continue
            }
        }

        emit OwnershipTransferred(itemId, previousOwner, newOwner);
    }

    /**
     * @dev Sync ownership from NFT marketplace (called by NFT contract)
     * @param collectibleId ID of the collectible
     * @param newOwner Address of the new owner
     */
    function syncOwnership(uint256 collectibleId, address newOwner) external {
        if (msg.sender != address(nftMarketplace)) revert NotAuthorized();
        if (newOwner == address(0)) revert ZeroAddress();

        CollectibleItem storage item = collectibles[collectibleId];
        if (item.owner == address(0)) revert ItemDoesNotExist(collectibleId);

        address previousOwner = item.owner;
        item.owner = newOwner;

        emit OwnershipTransferred(collectibleId, previousOwner, newOwner);
    }
}

// Interface for NFT-Collectible linking
interface INFTCollectibleLinking {
    function linkCollectible(uint256 tokenId, uint256 collectibleId) external;
}

// Interface for NFT ownership synchronization
interface INFTOwnershipSync {
    function syncNFTOwner(uint256 tokenId, address newOwner) external;
}
