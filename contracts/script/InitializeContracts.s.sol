// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

// Import your contract interfaces
import {CollectibleRegistry} from "../src/CollectibleRegistry.sol";
import {NFCLuxuryMarketplace} from "../src/NFCLuxuryMarketplace.sol";
import {AuthenticationController} from "../src/AuthenticationController.sol";

/// @title InitializeContracts
/// @notice A script to initialize the Collectible Authentication Platform contracts after deployment
/// @dev Run this after SimpleDeployer.s.sol
contract InitializeContracts is Script {
    using stdJson for string;

    // Deployed contract addresses
    address public collectibleRegistry;
    address public nfcLuxuryMarketplace;
    address public authenticationController;
    address public nfcCardFactory;
    address public luxServiceManager;

    // Configuration
    address public owner;
    uint8 public confidenceThreshold = 80; // Default 80%

    function setUp() public {
        // Get deployer address from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(deployerPrivateKey);

        // Load deployed addresses from JSON
        loadDeployment();

        // Load optional configuration
        confidenceThreshold = uint8(vm.envOr("CONFIDENCE_THRESHOLD", uint256(80)));

        console2.log("Deployer address:", owner);
        console2.log("Initializing with addresses:");
        console2.log("- CollectibleRegistry:", collectibleRegistry);
        console2.log("- NFCLuxuryMarketplace:", nfcLuxuryMarketplace);
        console2.log("- AuthenticationController:", authenticationController);
        console2.log("- NFCCardFactory:", nfcCardFactory);
        console2.log("- LuxServiceManager:", luxServiceManager);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console2.log("===== Initializing Collectible Authentication Platform Contracts =====");

        // 1. Initialize CollectibleRegistry
        initializeCollectibleRegistry();

        // 2. Initialize NFCLuxuryMarketplace
        initializeNFCLuxuryMarketplace();

        // 3. Initialize AuthenticationController
        initializeAuthenticationController();

        // 4. Set up roles and permissions
        setupRolesAndPermissions();

        vm.stopBroadcast();

        console2.log("===== Initialization Complete =====");
    }

    function loadDeployment() private {
        string memory outputPath = "deployments/collectible-auth/";
        string memory fileName = string.concat(outputPath, vm.toString(block.chainid), ".json");

        // Check if deployment data exists
        require(vm.exists(fileName), "Deployment data not found. Run SimpleDeployer.s.sol first.");

        // Read deployment data
        string memory json = vm.readFile(fileName);

        collectibleRegistry = json.readAddress(".addresses.collectibleRegistry");
        nfcLuxuryMarketplace = json.readAddress(".addresses.nfcLuxuryMarketplace");
        authenticationController = json.readAddress(".addresses.authenticationController");
        nfcCardFactory = json.readAddress(".addresses.nfcCardFactory");
        luxServiceManager = json.readAddress(".addresses.luxServiceManager");
    }

    function initializeCollectibleRegistry() private {
        // Using low-level call instead of direct method call
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,address)", owner, luxServiceManager, nfcLuxuryMarketplace
        );

        (bool success, bytes memory returnData) = collectibleRegistry.call(initData);

        if (success) {
            console2.log("CollectibleRegistry initialized successfully");
        } else {
            string memory reason = "";
            if (returnData.length > 0) {
                // Extract error message from revert reason
                assembly {
                    reason := add(returnData, 0x20)
                }
            }
            console2.log("Failed to initialize CollectibleRegistry:", reason);
        }
    }

    function initializeNFCLuxuryMarketplace() private {
        // Using low-level call instead of direct method call
        bytes memory initData =
            abi.encodeWithSignature("initialize(address,address)", owner, collectibleRegistry);

        (bool success, bytes memory returnData) = nfcLuxuryMarketplace.call(initData);

        if (success) {
            console2.log("NFCLuxuryMarketplace initialized successfully");
        } else {
            string memory reason = "";
            if (returnData.length > 0) {
                assembly {
                    reason := add(returnData, 0x20)
                }
            }
            console2.log("Failed to initialize NFCLuxuryMarketplace:", reason);
        }
    }

    function initializeAuthenticationController() private {
        // Using low-level call instead of direct method call
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,address,uint8,uint256)",
            owner,
            luxServiceManager,
            collectibleRegistry,
            confidenceThreshold,
            2 // Default value for requiredConfirmations
        );

        (bool success, bytes memory returnData) = authenticationController.call(initData);

        if (success) {
            console2.log("AuthenticationController initialized successfully");
        } else {
            string memory reason = "";
            if (returnData.length > 0) {
                assembly {
                    reason := add(returnData, 0x20)
                }
            }
            console2.log("Failed to initialize AuthenticationController:", reason);
        }
    }

    function setupRolesAndPermissions() private {
        // Grant AUTHENTICATOR_ROLE to AuthenticationController
        bytes32 AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");
        bytes memory grantRoleData = abi.encodeWithSignature(
            "grantRole(bytes32,address)", AUTHENTICATOR_ROLE, authenticationController
        );

        (bool grantSuccess, bytes memory grantReturn) = collectibleRegistry.call(grantRoleData);

        if (grantSuccess) {
            console2.log("Granted AUTHENTICATOR_ROLE to AuthenticationController");
        } else {
            string memory reason = "";
            if (grantReturn.length > 0) {
                assembly {
                    reason := add(grantReturn, 0x20)
                }
            }
            console2.log("Failed to grant AUTHENTICATOR_ROLE:", reason);
        }

        // Add NFCCardFactory as minter
        bytes memory addMinterData = abi.encodeWithSignature("addMinter(address)", nfcCardFactory);

        (bool minterSuccess, bytes memory minterReturn) = nfcLuxuryMarketplace.call(addMinterData);

        if (minterSuccess) {
            console2.log("Added NFCCardFactory as minter in NFCLuxuryMarketplace");
        } else {
            string memory reason = "";
            if (minterReturn.length > 0) {
                assembly {
                    reason := add(minterReturn, 0x20)
                }
            }
            console2.log("Failed to add NFCCardFactory as minter:", reason);
        }
    }
}
