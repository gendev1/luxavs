// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {TransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {UpgradeableProxyLib} from "./UpgradeableProxyLib.sol";

/// @title CollectibleAuthDeploymentLib
/// @notice Library for deploying and managing Collectible Authentication Platform contracts
library CollectibleAuthDeploymentLib {
    using stdJson for *;
    using Strings for *;
    using UpgradeableProxyLib for address;

    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    struct DeploymentData {
        address collectibleRegistry;
        address nfcLuxuryMarketplace;
        address nfcCardFactory;
        address authenticationController;
    }

    struct DeploymentConfigData {
        address rewardsOwner;
        address rewardsInitiator;
        uint256 rewardsOwnerKey;
        uint256 rewardsInitiatorKey;
        string ipfsGateway;
        uint256 authenticationConfidenceThreshold;
    }

    /// @dev Deploys Collectible Authentication Platform contracts
    /// @param proxyAdmin Address of the proxy admin
    /// @param luxServiceManager Address of the LuxServiceManager
    /// @param rewardsInitiator Address that can initiate rewards
    /// @param owner Owner of the contracts
    /// @param config Platform configuration data
    /// @return Deployment data with contract addresses
    function deployContracts(
        address proxyAdmin,
        address luxServiceManager,
        address rewardsInitiator,
        address owner,
        DeploymentConfigData memory config
    ) internal returns (DeploymentData memory) {
        DeploymentData memory result;

        // First, deploy implementation contracts
        address collectibleRegistryImpl = deployCollectibleRegistryImpl();
        address nfcLuxuryMarketplaceImpl = deployNFCLuxuryMarketplaceImpl();
        address authenticationControllerImpl = deployAuthenticationControllerImpl();

        console2.log("Deployed implementation contracts:");
        console2.log("- CollectibleRegistry: ", collectibleRegistryImpl);
        console2.log("- NFCLuxuryMarketplace: ", nfcLuxuryMarketplaceImpl);
        console2.log("- AuthenticationController: ", authenticationControllerImpl);

        // Deploy proxies pointing to implementations
        bytes memory collectibleRegistryData =
            getCollectibleRegistryInitData(owner, luxServiceManager);

        bytes memory nfcMarketplaceData = getNFCLuxuryMarketplaceInitData(owner);

        bytes memory authControllerData = getAuthenticationControllerInitData(
            owner, luxServiceManager, uint8(config.authenticationConfidenceThreshold)
        );

        // Deploy proxies with initialization data
        result.collectibleRegistry = address(
            new TransparentUpgradeableProxy(
                collectibleRegistryImpl, proxyAdmin, collectibleRegistryData
            )
        );

        result.nfcLuxuryMarketplace = address(
            new TransparentUpgradeableProxy(
                nfcLuxuryMarketplaceImpl, proxyAdmin, nfcMarketplaceData
            )
        );

        result.authenticationController = address(
            new TransparentUpgradeableProxy(
                authenticationControllerImpl, proxyAdmin, authControllerData
            )
        );

        console2.log("Deployed proxy contracts:");
        console2.log("- CollectibleRegistry: ", result.collectibleRegistry);
        console2.log("- NFCLuxuryMarketplace: ", result.nfcLuxuryMarketplace);
        console2.log("- AuthenticationController: ", result.authenticationController);

        // Update contract references
        // Note: You may need to adapt these calls based on your actual contract interfaces
        updateContractReferences(
            result.collectibleRegistry, result.nfcLuxuryMarketplace, result.authenticationController
        );

        // Deploy NFCCardFactory (non-upgradeable)
        result.nfcCardFactory =
            deployNFCCardFactory(result.nfcLuxuryMarketplace, result.collectibleRegistry);

        // Setup roles and permissions
        setupRolesAndPermissions(
            result.collectibleRegistry,
            result.nfcLuxuryMarketplace,
            result.authenticationController,
            result.nfcCardFactory
        );

        return result;
    }

    // Implementation deployment functions
    function deployCollectibleRegistryImpl() private returns (address) {
        // Replace with your actual contract deployment
        bytes memory bytecode = vm.getCode("CollectibleRegistry.sol:CollectibleRegistry");
        address implementation;
        assembly {
            implementation := create(0, add(bytecode, 0x20), mload(bytecode))
        }
        return implementation;
    }

    function deployNFCLuxuryMarketplaceImpl() private returns (address) {
        // Replace with your actual contract deployment
        bytes memory bytecode = vm.getCode("NFCLuxuryMarketplace.sol:NFCLuxuryMarketplace");
        address implementation;
        assembly {
            implementation := create(0, add(bytecode, 0x20), mload(bytecode))
        }
        return implementation;
    }

    function deployAuthenticationControllerImpl() private returns (address) {
        // Replace with your actual contract deployment
        bytes memory bytecode = vm.getCode("AuthenticationController.sol:AuthenticationController");
        address implementation;
        assembly {
            implementation := create(0, add(bytecode, 0x20), mload(bytecode))
        }
        return implementation;
    }

    function deployNFCCardFactory(
        address marketplace,
        address registry
    ) private returns (address) {
        // Replace with your actual contract deployment
        bytes memory bytecode = vm.getCode("NFCCardFactory.sol:NFCCardFactory");
        bytes memory constructorArgs = abi.encode(marketplace, registry);
        bytes memory deploymentBytecode = abi.encodePacked(bytecode, constructorArgs);

        address implementation;
        assembly {
            implementation := create(0, add(deploymentBytecode, 0x20), mload(deploymentBytecode))
            if iszero(extcodesize(implementation)) { revert(0, 0) }
        }
        return implementation;
    }

    // Initialize data functions - adapt these to match your actual contract initialize functions
    function getCollectibleRegistryInitData(
        address owner,
        address serviceManager
    ) private pure returns (bytes memory) {
        // IMPORTANT: You need to modify this to match your actual contract's initialize function
        // This is just an example that assumes an initialize(address,address) function
        return abi.encodeWithSignature("initialize(address,address)", owner, serviceManager);
    }

    function getNFCLuxuryMarketplaceInitData(
        address owner
    ) private pure returns (bytes memory) {
        // IMPORTANT: You need to modify this to match your actual contract's initialize function
        // This is just an example that assumes an initialize(address) function
        return abi.encodeWithSignature("initialize(address)", owner);
    }

    function getAuthenticationControllerInitData(
        address owner,
        address serviceManager,
        uint8 confidenceThreshold
    ) private pure returns (bytes memory) {
        // IMPORTANT: You need to modify this to match your actual contract's initialize function
        // This is just an example that assumes an initialize(address,address,uint8) function
        return abi.encodeWithSignature(
            "initialize(address,address,uint8)", owner, serviceManager, confidenceThreshold
        );
    }

    // After initialization setup - adapt these to match your actual contract interfaces
    function updateContractReferences(
        address registry,
        address marketplace,
        address controller
    ) private {
        // IMPORTANT: You need to adapt these calls to match your actual contract interfaces
        // This is a placeholder where you would update contract references after deployment

        // For example, if your contracts have functions to set references to each other:
        // ICollectibleRegistry(registry).setMarketplace(marketplace);
        // INFCLuxuryMarketplace(marketplace).setRegistry(registry);
        // IAuthenticationController(controller).setCollectibleRegistry(registry);

        console2.log("Contract references would be updated here");
        console2.log("Please adapt this function to match your actual contract interfaces");
    }

    function setupRolesAndPermissions(
        address registry,
        address marketplace,
        address controller,
        address factory
    ) private {
        // IMPORTANT: You need to adapt these calls to match your actual contract interfaces
        // This is a placeholder where you would set up roles and permissions

        // For example:
        // bytes32 AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");
        // ICollectibleRegistry(registry).grantRole(AUTHENTICATOR_ROLE, controller);
        // INFCLuxuryMarketplace(marketplace).addMinter(factory);

        console2.log("Roles and permissions would be set up here");
        console2.log("Please adapt this function to match your actual contract interfaces");
    }

    /// @dev Reads deployment configuration values from file
    /// @param directoryPath Directory containing config files
    /// @param fileName Name of the config file
    /// @return Configuration data
    function readDeploymentConfigValues(
        string memory directoryPath,
        string memory fileName
    ) internal view returns (DeploymentConfigData memory) {
        string memory pathToFile = string.concat(directoryPath, fileName);

        require(vm.exists(pathToFile), "CollectibleAuthDeployment: Config file does not exist");

        string memory json = vm.readFile(pathToFile);

        DeploymentConfigData memory data;
        data.rewardsOwner = json.readAddress(".addresses.rewardsOwner");
        data.rewardsInitiator = json.readAddress(".addresses.rewardsInitiator");
        data.rewardsOwnerKey = json.readUint(".keys.rewardsOwner");
        data.rewardsInitiatorKey = json.readUint(".keys.rewardsInitiator");
        data.ipfsGateway = json.readString(".settings.ipfsGateway");
        data.authenticationConfidenceThreshold =
            json.readUint(".settings.authenticationConfidenceThreshold");

        return data;
    }

    /// @dev Reads deployment configuration values for specified chain ID
    /// @param directoryPath Directory containing config files
    /// @param chainId Chain ID for config file name
    /// @return Configuration data
    function readDeploymentConfigValues(
        string memory directoryPath,
        uint256 chainId
    ) internal view returns (DeploymentConfigData memory) {
        return
            readDeploymentConfigValues(directoryPath, string.concat(vm.toString(chainId), ".json"));
    }

    /// @dev Writes deployment data to default output path
    /// @param data Deployment data to write
    function writeDeploymentJson(
        DeploymentData memory data
    ) internal {
        writeDeploymentJson("deployments/collectible-auth/", block.chainid, data);
    }

    /// @dev Writes deployment data to specified output path
    /// @param outputPath Directory to write deployment file
    /// @param chainId Chain ID for deployment file name
    /// @param data Deployment data to write
    function writeDeploymentJson(
        string memory outputPath,
        uint256 chainId,
        DeploymentData memory data
    ) internal {
        address proxyAdmin = address(UpgradeableProxyLib.getProxyAdmin(data.collectibleRegistry));

        string memory deploymentData = _generateDeploymentJson(data, proxyAdmin);

        string memory fileName = string.concat(outputPath, vm.toString(chainId), ".json");
        if (!vm.exists(outputPath)) {
            vm.createDir(outputPath, true);
        }

        vm.writeFile(fileName, deploymentData);
        console2.log("Deployment artifacts written to:", fileName);
    }

    /// @dev Generates deployment JSON string
    /// @param data Deployment data
    /// @param proxyAdmin Address of proxy admin
    /// @return JSON string with deployment data
    function _generateDeploymentJson(
        DeploymentData memory data,
        address proxyAdmin
    ) private view returns (string memory) {
        return string.concat(
            '{"lastUpdate":{"timestamp":"',
            vm.toString(block.timestamp),
            '","block_number":"',
            vm.toString(block.number),
            '"},"addresses":',
            _generateContractsJson(data, proxyAdmin),
            "}"
        );
    }

    /// @dev Generates JSON string with contract addresses
    /// @param data Deployment data
    /// @param proxyAdmin Address of proxy admin
    /// @return JSON string with contract addresses
    function _generateContractsJson(
        DeploymentData memory data,
        address proxyAdmin
    ) private view returns (string memory) {
        return string.concat(
            '{"proxyAdmin":"',
            proxyAdmin.toHexString(),
            '","collectibleRegistry":"',
            data.collectibleRegistry.toHexString(),
            '","collectibleRegistryImpl":"',
            data.collectibleRegistry.getImplementation().toHexString(),
            '","nfcLuxuryMarketplace":"',
            data.nfcLuxuryMarketplace.toHexString(),
            '","nfcLuxuryMarketplaceImpl":"',
            data.nfcLuxuryMarketplace.getImplementation().toHexString(),
            '","nfcCardFactory":"',
            data.nfcCardFactory.toHexString(),
            '","authenticationController":"',
            data.authenticationController.toHexString(),
            '","authenticationControllerImpl":"',
            data.authenticationController.getImplementation().toHexString(),
            '"}'
        );
    }
}
