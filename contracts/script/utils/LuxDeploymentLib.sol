// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {TransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {ECDSAStakeRegistry} from "@eigenlayer-middleware/src/unaudited/ECDSAStakeRegistry.sol";
import {LuxServiceManager} from "../../src/LuxServiceManager.sol";
import {IDelegationManager} from "@eigenlayer/contracts/interfaces/IDelegationManager.sol";
import {Quorum} from "@eigenlayer-middleware/src/interfaces/IECDSAStakeRegistryEventsAndErrors.sol";
import {UpgradeableProxyLib} from "./UpgradeableProxyLib.sol";
import {CoreDeploymentLib} from "./CoreDeploymentLib.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title LuxDeploymentLib
/// @notice Library for deploying and managing Lux Protocol contracts
/// @dev Based on HelloWorldDeploymentLib with modifications for Lux Protocol
library LuxDeploymentLib {
    using stdJson for *;
    using Strings for *;
    using UpgradeableProxyLib for address;

    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    struct DeploymentData {
        address luxServiceManager;
        address stakeRegistry;
        address strategy;
        address token;
    }

    struct DeploymentConfigData {
        address rewardsOwner;
        address rewardsInitiator;
        uint256 rewardsOwnerKey;
        uint256 rewardsInitiatorKey;
    }

    /// @dev Deploys Lux Protocol contracts
    /// @param proxyAdmin Address of the proxy admin
    /// @param core Core deployment data
    /// @param quorum Quorum configuration
    /// @param rewardsInitiator Address that can initiate rewards
    /// @param owner Owner of the contracts
    /// @return Deployment data with contract addresses
    function deployContracts(
        address proxyAdmin,
        CoreDeploymentLib.DeploymentData memory core,
        Quorum memory quorum,
        address rewardsInitiator,
        address owner
    ) internal returns (DeploymentData memory) {
        DeploymentData memory result;

        // First, deploy upgradeable proxy contracts that will point to the implementations.
        result.luxServiceManager = UpgradeableProxyLib.setUpEmptyProxy(proxyAdmin);
        result.stakeRegistry = UpgradeableProxyLib.setUpEmptyProxy(proxyAdmin);

        // Deploy the implementation contracts, using the proxy contracts as inputs
        address stakeRegistryImpl =
            address(new ECDSAStakeRegistry(IDelegationManager(core.delegationManager)));

        address luxServiceManagerImpl = address(
            new LuxServiceManager(
                core.avsDirectory,
                result.stakeRegistry,
                core.rewardsCoordinator,
                core.delegationManager
            )
        );

        // Upgrade contracts
        bytes memory upgradeCall =
            abi.encodeCall(ECDSAStakeRegistry.initialize, (result.luxServiceManager, 0, quorum));
        UpgradeableProxyLib.upgradeAndCall(result.stakeRegistry, stakeRegistryImpl, upgradeCall);

        upgradeCall = abi.encodeCall(LuxServiceManager.initialize, (owner, rewardsInitiator));
        UpgradeableProxyLib.upgradeAndCall(
            result.luxServiceManager, luxServiceManagerImpl, upgradeCall
        );

        return result;
    }

    /// @dev Reads deployment data from JSON file
    /// @param chainId Chain ID to read deployment for
    /// @return Deployment data
    function readDeploymentJson(
        uint256 chainId
    ) internal view returns (DeploymentData memory) {
        return readDeploymentJson("deployments/", chainId);
    }

    /// @dev Reads deployment data from JSON file with specified path
    /// @param directoryPath Directory containing deployment files
    /// @param chainId Chain ID to read deployment for
    /// @return Deployment data
    function readDeploymentJson(
        string memory directoryPath,
        uint256 chainId
    ) internal view returns (DeploymentData memory) {
        string memory fileName = string.concat(directoryPath, vm.toString(chainId), ".json");

        require(vm.exists(fileName), "LuxDeployment: Deployment file does not exist");

        string memory json = vm.readFile(fileName);

        DeploymentData memory data;
        data.luxServiceManager = json.readAddress(".addresses.luxServiceManager");
        data.stakeRegistry = json.readAddress(".addresses.stakeRegistry");
        data.strategy = json.readAddress(".addresses.strategy");
        data.token = json.readAddress(".addresses.token");

        return data;
    }

    /// @dev Writes deployment data to default output path
    /// @param data Deployment data to write
    function writeDeploymentJson(
        DeploymentData memory data
    ) internal {
        writeDeploymentJson("deployments/lux-protocol/", block.chainid, data);
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
        address proxyAdmin = address(UpgradeableProxyLib.getProxyAdmin(data.luxServiceManager));

        string memory deploymentData = _generateDeploymentJson(data, proxyAdmin);

        string memory fileName = string.concat(outputPath, vm.toString(chainId), ".json");
        if (!vm.exists(outputPath)) {
            vm.createDir(outputPath, true);
        }

        vm.writeFile(fileName, deploymentData);
        console2.log("Deployment artifacts written to:", fileName);
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

        require(vm.exists(pathToFile), "LuxDeployment: Deployment Config file does not exist");

        string memory json = vm.readFile(pathToFile);

        DeploymentConfigData memory data;
        data.rewardsOwner = json.readAddress(".addresses.rewardsOwner");
        data.rewardsInitiator = json.readAddress(".addresses.rewardsInitiator");
        data.rewardsOwnerKey = json.readUint(".keys.rewardsOwner");
        data.rewardsInitiatorKey = json.readUint(".keys.rewardsInitiator");
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
            '","luxServiceManager":"',
            data.luxServiceManager.toHexString(),
            '","luxServiceManagerImpl":"',
            data.luxServiceManager.getImplementation().toHexString(),
            '","stakeRegistry":"',
            data.stakeRegistry.toHexString(),
            '","stakeRegistryImpl":"',
            data.stakeRegistry.getImplementation().toHexString(),
            '","strategy":"',
            data.strategy.toHexString(),
            '","token":"',
            data.token.toHexString(),
            '"}'
        );
    }
}
