// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {TransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

// Import your contract artifacts
import {LuxServiceManager} from "../src/LuxServiceManager.sol";
import {CollectibleRegistry} from "../src/CollectibleRegistry.sol";
import {NFCLuxuryMarketplace} from "../src/NFCLuxuryMarketplace.sol";
import {NFCCardFactory} from "../src/NFCCardFactory.sol";
import {AuthenticationController} from "../src/AuthenticationController.sol";

/// @title DeployLuxProtocol
/// @notice A simplified script to deploy the Lux Protocol with proper initialization
contract DeployLuxProtocol is Script {
    using stdJson for string;

    // Deployed contract addresses
    address public proxyAdmin;
    address public luxServiceManager;
    address public collectibleRegistry;
    address public nfcLuxuryMarketplace;
    address public authenticationController;
    address public nfcCardFactory;
    address public accessControl;

    // Mock addresses for Eigenlayer components (for development/testing)
    address public mockAvsDirectory;
    address public mockStakeRegistry;
    address public mockRewardsCoordinator;
    address public mockDelegationManager;

    // Configuration
    address public owner;
    uint8 public confidenceThreshold = 75; // Default 75%
    uint256 public requiredConfirmations = 2;

    // Roles
    bytes32 public constant TASK_CREATOR_ROLE = keccak256("TASK_CREATOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");

    function setUp() public {
        // Get deployer address from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(deployerPrivateKey);

        // For testing, set up mock addresses for Eigenlayer components
        mockAvsDirectory = address(0x1111);
        mockStakeRegistry = address(0x2222);
        mockRewardsCoordinator = address(0x3333);
        mockDelegationManager = address(0x4444);

        // Load optional configuration
        confidenceThreshold = uint8(vm.envOr("CONFIDENCE_THRESHOLD", uint256(75)));
        requiredConfirmations = vm.envOr("REQUIRED_CONFIRMATIONS", uint256(2));

        console2.log("Deployer address:", owner);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console2.log("===== Deploying Lux Protocol Contracts =====");

        // 1. First deploy a custom SimpleAccessControl contract
        accessControl = address(new SimpleAccessControl());
        console2.log("SimpleAccessControl deployed at:", accessControl);

        // Initialize the access control contract
        SimpleAccessControl(accessControl).initialize(owner);
        console2.log("SimpleAccessControl initialized");

        // 2. Deploy ProxyAdmin
        proxyAdmin = address(new ProxyAdmin());
        console2.log("ProxyAdmin deployed at:", proxyAdmin);

        // 3. Deploy LuxServiceManager
        address luxServiceManagerImpl = address(
            new LuxServiceManager(
                mockAvsDirectory,
                mockStakeRegistry,
                mockRewardsCoordinator,
                mockDelegationManager,
                accessControl
            )
        );
        console2.log("LuxServiceManager implementation deployed at:", luxServiceManagerImpl);

        // Initialize LuxServiceManager
        luxServiceManager = address(
            new TransparentUpgradeableProxy(
                luxServiceManagerImpl,
                proxyAdmin,
                abi.encodeWithSelector(
                    LuxServiceManager.initialize.selector, owner, owner, accessControl
                )
            )
        );
        console2.log("LuxServiceManager proxy deployed at:", luxServiceManager);

        // Now let's deploy NFCLuxuryMarketplace first as a placeholder
        // This is needed because CollectibleRegistry requires a non-zero address in constructor
        address nfcLuxuryMarketplaceImpl = address(new NFCLuxuryMarketplace());
        console2.log("NFCLuxuryMarketplace implementation deployed at:", nfcLuxuryMarketplaceImpl);

        // Deploy NFCLuxuryMarketplace proxy with empty initialization data first
        nfcLuxuryMarketplace = address(
            new TransparentUpgradeableProxy(
                nfcLuxuryMarketplaceImpl,
                proxyAdmin,
                "" // Empty initialization data
            )
        );
        console2.log("NFCLuxuryMarketplace proxy deployed at:", nfcLuxuryMarketplace);

        // Now deploy CollectibleRegistry with the proper addresses
        address collectibleRegistryImpl =
            address(new CollectibleRegistry(luxServiceManager, nfcLuxuryMarketplace));
        console2.log("CollectibleRegistry implementation deployed at:", collectibleRegistryImpl);

        // Deploy CollectibleRegistry proxy with empty init data
        collectibleRegistry = address(
            new TransparentUpgradeableProxy(
                collectibleRegistryImpl,
                proxyAdmin,
                "" // Empty initialization data
            )
        );
        console2.log("CollectibleRegistry proxy deployed at:", collectibleRegistry);

        // Deploy AuthenticationController
        address authenticationControllerImpl =
            address(new AuthenticationController(luxServiceManager, collectibleRegistry));
        console2.log(
            "AuthenticationController implementation deployed at:", authenticationControllerImpl
        );

        authenticationController = address(
            new TransparentUpgradeableProxy(
                authenticationControllerImpl,
                proxyAdmin,
                "" // Empty initialization data
            )
        );
        console2.log("AuthenticationController proxy deployed at:", authenticationController);

        // Now initialize the contracts in the proper order

        // Initialize CollectibleRegistry
        CollectibleRegistry(collectibleRegistry).initialize(
            owner, luxServiceManager, nfcLuxuryMarketplace
        );
        console2.log("CollectibleRegistry initialized");

        // Initialize NFCLuxuryMarketplace
        NFCLuxuryMarketplace(nfcLuxuryMarketplace).initialize(owner, collectibleRegistry);
        console2.log("NFCLuxuryMarketplace initialized");

        // Initialize AuthenticationController
        AuthenticationController(authenticationController).initialize(
            owner,
            luxServiceManager,
            collectibleRegistry,
            confidenceThreshold,
            requiredConfirmations
        );
        console2.log("AuthenticationController initialized");

        // Deploy NFCCardFactory (non-proxy contract)
        nfcCardFactory = address(new NFCCardFactory(nfcLuxuryMarketplace, collectibleRegistry));
        console2.log("NFCCardFactory deployed at:", nfcCardFactory);

        // Set up roles and permissions
        console2.log("Setting up roles and permissions...");

        // Grant TASK_CREATOR_ROLE to owner in SimpleAccessControl
        SimpleAccessControl(accessControl).grantRole(TASK_CREATOR_ROLE, owner);
        console2.log("Granted TASK_CREATOR_ROLE to owner");

        // Grant AUTHENTICATOR_ROLE to AuthenticationController in CollectibleRegistry
        CollectibleRegistry(collectibleRegistry).grantRole(
            AUTHENTICATOR_ROLE, authenticationController
        );
        console2.log("Granted AUTHENTICATOR_ROLE to AuthenticationController");

        // Grant OPERATOR_ROLE to owner in AuthenticationController
        AuthenticationController(authenticationController).grantRole(OPERATOR_ROLE, owner);
        console2.log("Granted OPERATOR_ROLE to owner");

        // Add NFCCardFactory as minter in NFCLuxuryMarketplace
        NFCLuxuryMarketplace(nfcLuxuryMarketplace).addMinter(nfcCardFactory);
        console2.log("Added NFCCardFactory as minter in NFCLuxuryMarketplace");

        // Verify deployment
        verifyDeployment();

        // Save deployment information
        saveDeployment();

        vm.stopBroadcast();

        console2.log("===== Deployment Complete =====");
    }

    function verifyDeployment() internal view {
        console2.log("Verifying deployment...");

        uint32 taskCount = LuxServiceManager(luxServiceManager).latestTaskNum();
        console2.log("LuxServiceManager latestTaskNum:", taskCount);
        console2.log("LuxServiceManager verified");
    }

    function saveDeployment() internal {
        string memory deploymentPath = "deployments/";
        string memory fileName = string.concat(deploymentPath, vm.toString(block.chainid), ".json");

        // Ensure directory exists
        if (!vm.exists(deploymentPath)) {
            vm.createDir(deploymentPath, true);
        }

        // Create JSON with deployment data
        string memory json = vm.serializeAddress("deployment", "proxyAdmin", proxyAdmin);
        json = vm.serializeAddress("deployment", "accessControl", accessControl);
        json = vm.serializeAddress("deployment", "luxServiceManager", luxServiceManager);
        json = vm.serializeAddress("deployment", "collectibleRegistry", collectibleRegistry);
        json = vm.serializeAddress("deployment", "nfcLuxuryMarketplace", nfcLuxuryMarketplace);
        json =
            vm.serializeAddress("deployment", "authenticationController", authenticationController);
        json = vm.serializeAddress("deployment", "nfcCardFactory", nfcCardFactory);

        // Write the deployment file
        vm.writeJson(json, fileName);
        console2.log("Deployment saved to:", fileName);
    }
}

// A simple implementation of AccessControl
contract SimpleAccessControl {
    // Role => Address => Has role
    mapping(bytes32 => mapping(address => bool)) private _roles;

    // Events
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    // Constants
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    // Initializer
    function initialize(
        address admin
    ) public {
        // Grant the default admin role to the specified admin address
        _roles[DEFAULT_ADMIN_ROLE][admin] = true;
        emit RoleGranted(DEFAULT_ADMIN_ROLE, admin, address(0));
    }

    // Check if an account has a specific role
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    // Grant a role to an account
    function grantRole(bytes32 role, address account) public {
        // Only admins can grant roles
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "AccessControl: sender must be an admin");
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    // Revoke a role from an account
    function revokeRole(bytes32 role, address account) public {
        // Only admins can revoke roles
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "AccessControl: sender must be an admin");
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
}
