// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {LuxServiceManager} from "../src/LuxServiceManager.sol";
import {CollectibleRegistry} from "../src/CollectibleRegistry.sol";
import {NFCLuxuryMarketplace} from "../src/NFCLuxuryMarketplace.sol";
import {AuthenticationController} from "../src/AuthenticationController.sol";
import {SimpleAccessControl} from "./deploylux.s.sol";

/// @title InitializeLuxProtocol
/// @notice A simplified script to initialize Lux Protocol contracts that are already deployed
contract InitializeLuxProtocol is Script {
    using stdJson for string;

    // Deployed contract addresses
    address public luxServiceManager;
    address public collectibleRegistry;
    address public nfcLuxuryMarketplace;
    address public authenticationController;
    address public nfcCardFactory;
    address public accessControl;

    // Configuration
    address public owner;
    uint8 public confidenceThreshold = 75; // Default 75%
    uint256 public requiredConfirmations = 2;

    // Roles
    bytes32 public constant TASK_CREATOR_ROLE = keccak256("TASK_CREATOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");

    // Function selectors - define these directly
    bytes4 private constant LATEST_TASK_NUM_SELECTOR = bytes4(keccak256("latestTaskNum()"));
    bytes4 private constant INITIALIZE_SELECTOR =
        bytes4(keccak256("initialize(address,address,address)"));
    bytes4 private constant HAS_ROLE_SELECTOR = bytes4(keccak256("hasRole(bytes32,address)"));
    bytes4 private constant CONFIDENCE_THRESHOLD_SELECTOR =
        bytes4(keccak256("confidenceThreshold()"));
    bytes4 private constant OWNER_SELECTOR = bytes4(keccak256("owner()"));
    bytes4 private constant IS_MINTER_SELECTOR = bytes4(keccak256("isAuthorizedMinter(address)"));
    bytes4 private constant GRANT_ROLE_SELECTOR = bytes4(keccak256("grantRole(bytes32,address)"));
    bytes4 private constant ADD_MINTER_SELECTOR = bytes4(keccak256("addMinter(address)"));

    function setUp() public {
        // Get deployer address from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(deployerPrivateKey);

        // Load contract addresses from deployment file or environment variables
        loadDeploymentAddresses();

        // Load optional configuration
        confidenceThreshold = uint8(vm.envOr("CONFIDENCE_THRESHOLD", uint256(75)));
        requiredConfirmations = vm.envOr("REQUIRED_CONFIRMATIONS", uint256(2));

        console2.log("Initializer address:", owner);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console2.log("===== Initializing Lux Protocol Contracts =====");

        // 1. Verify contract addresses
        verifyContractAddresses();

        // 2. Initialize contracts in sequence
        initializeAccessControl();
        initializeLuxServiceManager();
        initializeCollectibleRegistry();
        initializeNFCLuxuryMarketplace();
        initializeAuthenticationController();

        // 3. Set up roles and permissions
        setupRolesAndPermissions();

        // 4. Verify initialization was successful
        verifyInitialization();

        vm.stopBroadcast();

        console2.log("===== Initialization Complete =====");
    }

    function loadDeploymentAddresses() internal {
        // First check for deployment JSON
        string memory deploymentPath =
            string.concat("deployments/", vm.toString(block.chainid), ".json");

        if (vm.exists(deploymentPath)) {
            console2.log("Loading addresses from deployment file:", deploymentPath);
            string memory json = vm.readFile(deploymentPath);

            // First, attempt to load using direct key-value format
            try vm.parseJsonAddress(json, ".luxServiceManager") returns (address addr) {
                console2.log("Found direct key format in JSON");
                luxServiceManager = addr;
                collectibleRegistry = vm.parseJsonAddress(json, ".collectibleRegistry");
                nfcLuxuryMarketplace = vm.parseJsonAddress(json, ".nfcLuxuryMarketplace");
                authenticationController = vm.parseJsonAddress(json, ".authenticationController");
                nfcCardFactory = vm.parseJsonAddress(json, ".nfcCardFactory");
                accessControl = vm.parseJsonAddress(json, ".accessControl");
            } catch {
                // If direct format fails, try using deployment.{contract} format
                try vm.parseJsonAddress(json, ".deployment.luxServiceManager") returns (
                    address addr
                ) {
                    console2.log("Found nested deployment format in JSON");
                    luxServiceManager = addr;
                    collectibleRegistry =
                        vm.parseJsonAddress(json, ".deployment.collectibleRegistry");
                    nfcLuxuryMarketplace =
                        vm.parseJsonAddress(json, ".deployment.nfcLuxuryMarketplace");
                    authenticationController =
                        vm.parseJsonAddress(json, ".deployment.authenticationController");
                    nfcCardFactory = vm.parseJsonAddress(json, ".deployment.nfcCardFactory");
                    accessControl = vm.parseJsonAddress(json, ".deployment.accessControl");
                } catch {
                    // Last attempt - try with contracts.{contract} format
                    try vm.parseJsonAddress(json, ".contracts.luxServiceManager") returns (
                        address addr
                    ) {
                        console2.log("Found contracts format in JSON");
                        luxServiceManager = addr;
                        collectibleRegistry =
                            vm.parseJsonAddress(json, ".contracts.collectibleRegistry");
                        nfcLuxuryMarketplace =
                            vm.parseJsonAddress(json, ".contracts.nfcLuxuryMarketplace");
                        authenticationController =
                            vm.parseJsonAddress(json, ".contracts.authenticationController");
                        nfcCardFactory = vm.parseJsonAddress(json, ".contracts.nfcCardFactory");
                        accessControl = vm.parseJsonAddress(json, ".contracts.accessControl");
                    } catch {
                        console2.log(
                            "Could not parse JSON deployment file, using environment variables"
                        );
                        loadFromEnvironment();
                    }
                }
            }
        } else {
            // Otherwise, try to load from environment variables
            console2.log("No deployment file found, loading from environment variables");
            loadFromEnvironment();
        }
    }

    function loadFromEnvironment() internal {
        luxServiceManager = vm.envAddress("LUX_SERVICE_MANAGER_ADDRESS");
        collectibleRegistry = vm.envAddress("COLLECTIBLE_REGISTRY_ADDRESS");
        nfcLuxuryMarketplace = vm.envAddress("NFC_LUXURY_MARKETPLACE_ADDRESS");
        authenticationController = vm.envAddress("AUTHENTICATION_CONTROLLER_ADDRESS");
        nfcCardFactory = vm.envAddress("NFC_CARD_FACTORY_ADDRESS");
        accessControl = vm.envAddress("ACCESS_CONTROL_ADDRESS");
    }

    function verifyContractAddresses() internal view {
        require(luxServiceManager != address(0), "LuxServiceManager address not set");
        require(collectibleRegistry != address(0), "CollectibleRegistry address not set");
        require(nfcLuxuryMarketplace != address(0), "NFCLuxuryMarketplace address not set");
        require(authenticationController != address(0), "AuthenticationController address not set");
        require(nfcCardFactory != address(0), "NFCCardFactory address not set");
        require(accessControl != address(0), "AccessControl address not set");

        console2.log("Contract addresses verified:");
        console2.log("- LuxServiceManager:", luxServiceManager);
        console2.log("- CollectibleRegistry:", collectibleRegistry);
        console2.log("- NFCLuxuryMarketplace:", nfcLuxuryMarketplace);
        console2.log("- AuthenticationController:", authenticationController);
        console2.log("- NFCCardFactory:", nfcCardFactory);
        console2.log("- AccessControl:", accessControl);
    }

    function initializeAccessControl() internal {
        console2.log("Initializing AccessControl...");

        // Check if already initialized - safely without try/catch
        (bool success, bytes memory data) =
            accessControl.staticcall(abi.encodeWithSelector(HAS_ROLE_SELECTOR, bytes32(0), owner));

        if (success) {
            console2.log("AccessControl is already initialized");
        } else {
            console2.log("Initializing AccessControl...");
            (bool initSuccess,) = accessControl.call(
                abi.encodeWithSelector(bytes4(keccak256("initialize(address)")), owner)
            );

            if (initSuccess) {
                console2.log("AccessControl initialized successfully");
            } else {
                console2.log("Failed to initialize AccessControl");
            }
        }
    }

    function initializeLuxServiceManager() internal {
        console2.log("Initializing LuxServiceManager...");

        // Check if already initialized - safely without try/catch
        (bool success,) =
            luxServiceManager.staticcall(abi.encodeWithSelector(LATEST_TASK_NUM_SELECTOR));

        if (success) {
            console2.log("LuxServiceManager is already initialized");
        } else {
            // Not initialized, proceed with initialization
            console2.log("LuxServiceManager needs initialization");

            (bool initSuccess,) = luxServiceManager.call(
                abi.encodeWithSelector(
                    INITIALIZE_SELECTOR,
                    owner, // initialOwner
                    owner, // rewardsInitiator
                    accessControl
                )
            );

            if (initSuccess) {
                console2.log("LuxServiceManager initialized successfully");
            } else {
                console2.log("Failed to initialize LuxServiceManager");
            }
        }
    }

    function initializeCollectibleRegistry() internal {
        console2.log("Initializing CollectibleRegistry...");

        // Check if already initialized - safely without try/catch
        (bool success,) = collectibleRegistry.staticcall(
            abi.encodeWithSelector(HAS_ROLE_SELECTOR, bytes32(0), owner)
        );

        if (success) {
            console2.log("CollectibleRegistry is already initialized");
        } else {
            // Not initialized, proceed with initialization
            console2.log("CollectibleRegistry needs initialization");

            (bool initSuccess,) = collectibleRegistry.call(
                abi.encodeWithSelector(
                    INITIALIZE_SELECTOR, owner, luxServiceManager, nfcLuxuryMarketplace
                )
            );

            if (initSuccess) {
                console2.log("CollectibleRegistry initialized successfully");
            } else {
                console2.log("Failed to initialize CollectibleRegistry");
            }
        }
    }

    function initializeNFCLuxuryMarketplace() internal {
        console2.log("Initializing NFCLuxuryMarketplace...");

        // Check if already initialized - safely without try/catch
        (bool success,) = nfcLuxuryMarketplace.staticcall(abi.encodeWithSelector(OWNER_SELECTOR));

        if (success) {
            console2.log("NFCLuxuryMarketplace is already initialized");
        } else {
            // Not initialized, proceed with initialization
            console2.log("NFCLuxuryMarketplace needs initialization");

            (bool initSuccess,) = nfcLuxuryMarketplace.call(
                abi.encodeWithSelector(
                    bytes4(keccak256("initialize(address,address)")), owner, collectibleRegistry
                )
            );

            if (initSuccess) {
                console2.log("NFCLuxuryMarketplace initialized successfully");
            } else {
                console2.log("Failed to initialize NFCLuxuryMarketplace");
            }
        }
    }

    function initializeAuthenticationController() internal {
        console2.log("Initializing AuthenticationController...");

        // Check if already initialized - safely without try/catch
        (bool success,) = authenticationController.staticcall(
            abi.encodeWithSelector(CONFIDENCE_THRESHOLD_SELECTOR)
        );

        if (success) {
            console2.log("AuthenticationController is already initialized");
        } else {
            // Not initialized, proceed with initialization
            console2.log("AuthenticationController needs initialization");

            (bool initSuccess,) = authenticationController.call(
                abi.encodeWithSelector(
                    bytes4(keccak256("initialize(address,address,address,uint8,uint256)")),
                    owner,
                    luxServiceManager,
                    collectibleRegistry,
                    confidenceThreshold,
                    requiredConfirmations
                )
            );

            if (initSuccess) {
                console2.log("AuthenticationController initialized successfully");
            } else {
                console2.log("Failed to initialize AuthenticationController");
            }
        }
    }

    function setupRolesAndPermissions() internal {
        console2.log("Setting up roles and permissions...");

        // Grant TASK_CREATOR_ROLE to owner in SimpleAccessControl
        bool hasTaskCreatorRole;
        (bool success1, bytes memory data1) = accessControl.staticcall(
            abi.encodeWithSelector(HAS_ROLE_SELECTOR, TASK_CREATOR_ROLE, owner)
        );

        if (success1) {
            hasTaskCreatorRole = abi.decode(data1, (bool));
        }

        if (!hasTaskCreatorRole) {
            SimpleAccessControl(accessControl).grantRole(TASK_CREATOR_ROLE, owner);
            console2.log("Granted TASK_CREATOR_ROLE to owner");
        } else {
            console2.log("Owner already has TASK_CREATOR_ROLE");
        }

        // Grant AUTHENTICATOR_ROLE to AuthenticationController in CollectibleRegistry
        bool hasAuthenticatorRole;
        (bool success2, bytes memory data2) = collectibleRegistry.staticcall(
            abi.encodeWithSelector(HAS_ROLE_SELECTOR, AUTHENTICATOR_ROLE, authenticationController)
        );

        if (success2) {
            hasAuthenticatorRole = abi.decode(data2, (bool));
        }

        if (!hasAuthenticatorRole) {
            CollectibleRegistry(collectibleRegistry).grantRole(
                AUTHENTICATOR_ROLE, authenticationController
            );
            console2.log("Granted AUTHENTICATOR_ROLE to AuthenticationController");
        } else {
            console2.log("AuthenticationController already has AUTHENTICATOR_ROLE");
        }

        // Grant OPERATOR_ROLE to owner in AuthenticationController
        bool hasOperatorRole;
        (bool success3, bytes memory data3) = authenticationController.staticcall(
            abi.encodeWithSelector(HAS_ROLE_SELECTOR, OPERATOR_ROLE, owner)
        );

        if (success3) {
            hasOperatorRole = abi.decode(data3, (bool));
        }

        if (!hasOperatorRole) {
            AuthenticationController(authenticationController).grantRole(OPERATOR_ROLE, owner);
            console2.log("Granted OPERATOR_ROLE to owner");
        } else {
            console2.log("Owner already has OPERATOR_ROLE");
        }

        // Add NFCCardFactory as minter in NFCLuxuryMarketplace
        bool isMinter;
        (bool success4, bytes memory data4) = nfcLuxuryMarketplace.staticcall(
            abi.encodeWithSelector(IS_MINTER_SELECTOR, nfcCardFactory)
        );

        if (success4) {
            isMinter = abi.decode(data4, (bool));
        }

        if (!isMinter) {
            NFCLuxuryMarketplace(nfcLuxuryMarketplace).addMinter(nfcCardFactory);
            console2.log("Added NFCCardFactory as minter in NFCLuxuryMarketplace");
        } else {
            console2.log("NFCCardFactory is already a minter");
        }
    }

    function verifyInitialization() internal view {
        console2.log("Verifying initialization...");

        // Verify LuxServiceManager
        uint32 taskCount = LuxServiceManager(luxServiceManager).latestTaskNum();
        console2.log("LuxServiceManager latestTaskNum:", taskCount);
        console2.log("LuxServiceManager verification successful");

        // Additional verifications can be added here for other contracts
        console2.log("All contracts initialized successfully");
    }
}
