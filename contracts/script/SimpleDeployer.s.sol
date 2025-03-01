// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {TransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

// Import your contract artifacts
import {CollectibleRegistry} from "../src/CollectibleRegistry.sol";
import {NFCLuxuryMarketplace} from "../src/NFCLuxuryMarketplace.sol";
import {NFCCardFactory} from "../src/NFCCardFactory.sol";
import {AuthenticationController} from "../src/AuthenticationController.sol";

/// @title SimpleDeployer
/// @notice A simple script to deploy the Collectible Authentication Platform contracts
/// @dev This script just deploys contracts and records addresses, without initialization
contract SimpleDeployer is Script {
    using stdJson for string;

    // Deployed contract addresses
    address public proxyAdmin;
    address public collectibleRegistry;
    address public collectibleRegistryImpl;
    address public nfcLuxuryMarketplace;
    address public nfcLuxuryMarketplaceImpl;
    address public authenticationController;
    address public authenticationControllerImpl;
    address public nfcCardFactory;

    // Configuration
    address public owner;
    address public luxServiceManager;

    function setUp() public {
        // Get deployer address from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(deployerPrivateKey);

        // Get LuxServiceManager address from environment or use a default
        luxServiceManager =
            vm.envOr("LUX_SERVICE_MANAGER", address(0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575));

        console2.log("Deployer address:", owner);
        console2.log("LuxServiceManager address:", luxServiceManager);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console2.log("===== Deploying Collectible Authentication Platform Contracts =====");

        // 1. Deploy ProxyAdmin
        proxyAdmin = address(new ProxyAdmin());
        console2.log("ProxyAdmin deployed at:", proxyAdmin);

        // 2. Deploy implementation contracts
        deployImplementations();

        // 3. Deploy proxy contracts
        deployProxies();

        // 4. Deploy NFCCardFactory
        nfcCardFactory = address(new NFCCardFactory(nfcLuxuryMarketplace, collectibleRegistry));
        console2.log("NFCCardFactory deployed at:", nfcCardFactory);

        vm.stopBroadcast();

        // 5. Save deployment information
        saveDeployment();

        console2.log("===== Deployment Complete =====");
        console2.log("After deployment, you will need to manually initialize the contracts.");
        console2.log(
            "See deployment data at: deployments/collectible-auth/",
            vm.toString(block.chainid),
            ".json"
        );
    }

    function deployImplementations() private {
        // Deploy implementation contracts
        collectibleRegistryImpl = address(new CollectibleRegistry(luxServiceManager, address(1)));
        console2.log("CollectibleRegistry implementation deployed at:", collectibleRegistryImpl);

        nfcLuxuryMarketplaceImpl = address(new NFCLuxuryMarketplace());
        console2.log("NFCLuxuryMarketplace implementation deployed at:", nfcLuxuryMarketplaceImpl);

        authenticationControllerImpl =
            address(new AuthenticationController(luxServiceManager, address(1)));
        console2.log(
            "AuthenticationController implementation deployed at:", authenticationControllerImpl
        );
    }

    function deployProxies() private {
        // We're deploying empty proxies without initialization
        // You'll need to initialize them manually after deployment

        collectibleRegistry = address(
            new TransparentUpgradeableProxy(
                collectibleRegistryImpl,
                proxyAdmin,
                "" // Empty initialization data
            )
        );
        console2.log("CollectibleRegistry proxy deployed at:", collectibleRegistry);

        nfcLuxuryMarketplace = address(
            new TransparentUpgradeableProxy(
                nfcLuxuryMarketplaceImpl,
                proxyAdmin,
                "" // Empty initialization data
            )
        );
        console2.log("NFCLuxuryMarketplace proxy deployed at:", nfcLuxuryMarketplace);

        authenticationController = address(
            new TransparentUpgradeableProxy(
                authenticationControllerImpl,
                proxyAdmin,
                "" // Empty initialization data
            )
        );
        console2.log("AuthenticationController proxy deployed at:", authenticationController);
    }

    function saveDeployment() private {
        string memory deploymentJson = generateDeploymentJson();
        string memory outputPath = "deployments/collectible-auth/";
        string memory fileName = string.concat(outputPath, vm.toString(block.chainid), ".json");

        // Create directory if it doesn't exist
        if (!vm.exists(outputPath)) {
            vm.createDir(outputPath, true);
        }

        // Write deployment data to file
        vm.writeFile(fileName, deploymentJson);
    }

    function generateDeploymentJson() private view returns (string memory) {
        string memory timestamp = vm.toString(block.timestamp);
        string memory blockNumber = vm.toString(block.number);

        return string.concat(
            '{"lastUpdate":{"timestamp":"',
            timestamp,
            '","block_number":"',
            blockNumber,
            '"},"addresses":{',
            '"proxyAdmin":"',
            vm.toString(proxyAdmin),
            '","collectibleRegistry":"',
            vm.toString(collectibleRegistry),
            '","collectibleRegistryImpl":"',
            vm.toString(collectibleRegistryImpl),
            '","nfcLuxuryMarketplace":"',
            vm.toString(nfcLuxuryMarketplace),
            '","nfcLuxuryMarketplaceImpl":"',
            vm.toString(nfcLuxuryMarketplaceImpl),
            '","authenticationController":"',
            vm.toString(authenticationController),
            '","authenticationControllerImpl":"',
            vm.toString(authenticationControllerImpl),
            '","nfcCardFactory":"',
            vm.toString(nfcCardFactory),
            '","luxServiceManager":"',
            vm.toString(luxServiceManager),
            '"}}'
        );
    }
}
