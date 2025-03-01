// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {Test} from "forge-std/Test.sol";

import {CoreDeploymentLib} from "./utils/CoreDeploymentLib.sol";
import {LuxDeploymentLib} from "./utils/LuxDeploymentLib.sol";
import {CollectibleAuthDeploymentLib} from "./utils/CollectibleAuthDeploymentLib.sol";
import {UpgradeableProxyLib} from "./utils/UpgradeableProxyLib.sol";

import {ERC20Mock} from "../test/ERC20Mock.sol";
import {StrategyFactory} from "@eigenlayer/contracts/strategies/StrategyFactory.sol";
import {IStrategy} from
    "@eigenlayer-middleware/src/interfaces/IECDSAStakeRegistryEventsAndErrors.sol";
import {
    Quorum,
    StrategyParams
} from "@eigenlayer-middleware/src/interfaces/IECDSAStakeRegistryEventsAndErrors.sol";

/// @title DeployComplete
/// @notice Comprehensive script that deploys the entire stack from EigenLayer to Collectible Authentication Platform
/// @dev For development and testing purposes
contract DeployComplete is Script, Test {
    using CoreDeploymentLib for *;
    using UpgradeableProxyLib for address;

    // Deployment Variables
    address private deployer;
    address proxyAdmin;
    address rewardsOwner;
    address rewardsInitiator;
    IStrategy luxStrategy;
    CoreDeploymentLib.DeploymentData coreDeployment;
    CoreDeploymentLib.DeploymentConfigData coreConfig;
    LuxDeploymentLib.DeploymentData luxDeployment;
    LuxDeploymentLib.DeploymentConfigData luxConfig;
    CollectibleAuthDeploymentLib.DeploymentData collectibleAuthDeployment;
    CollectibleAuthDeploymentLib.DeploymentConfigData collectibleAuthConfig;
    Quorum internal quorum;
    ERC20Mock token;

    function setUp() public virtual {
        deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        vm.label(deployer, "Deployer");

        // Load configurations
        coreConfig = CoreDeploymentLib.readDeploymentConfigValues("config/core/", block.chainid);
        luxConfig =
            LuxDeploymentLib.readDeploymentConfigValues("config/lux-protocol/", block.chainid);
        collectibleAuthConfig = CollectibleAuthDeploymentLib.readDeploymentConfigValues(
            "config/collectible-auth/", block.chainid
        );

        rewardsOwner = luxConfig.rewardsOwner;
        rewardsInitiator = luxConfig.rewardsInitiator;
    }

    function run() external {
        console2.log("Starting deployment of complete Collectible Authentication Platform stack...");

        // Phase 1: Deploy EigenLayer Core
        deployEigenLayerCore();

        // Phase 2: Deploy Lux Protocol AVS
        deployLuxProtocol();

        // Phase 3: Deploy Collectible Authentication Platform
        deployCollectibleAuth();

        console2.log("Complete deployment finished successfully!");
    }

    function deployEigenLayerCore() internal {
        console2.log("Phase 1: Deploying EigenLayer Core...");

        vm.startBroadcast(deployer);

        proxyAdmin = UpgradeableProxyLib.deployProxyAdmin();
        coreDeployment = CoreDeploymentLib.deployContracts(proxyAdmin, coreConfig);

        // Deploy a mock token for testing
        token = new ERC20Mock();

        vm.stopBroadcast();

        // Save deployment data
        CoreDeploymentLib.writeDeploymentJson(coreDeployment);

        console2.log("EigenLayer Core deployed successfully.");
    }

    function deployLuxProtocol() internal {
        console2.log("Phase 2: Deploying Lux Protocol AVS...");

        vm.startBroadcast(deployer);

        // Deploy strategy using the mock token
        luxStrategy =
            IStrategy(StrategyFactory(coreDeployment.strategyFactory).deployNewStrategy(token));

        // Configure quorum with strategy parameters
        quorum.strategies.push(StrategyParams({strategy: luxStrategy, multiplier: 10_000}));

        // Deploy Lux Protocol contracts
        luxDeployment = LuxDeploymentLib.deployContracts(
            proxyAdmin, coreDeployment, quorum, rewardsInitiator, rewardsOwner
        );

        // Record deployed strategy and token addresses
        luxDeployment.strategy = address(luxStrategy);
        luxDeployment.token = address(token);

        vm.stopBroadcast();

        // Save deployment data
        LuxDeploymentLib.writeDeploymentJson(luxDeployment);

        console2.log("Lux Protocol AVS deployed successfully.");
    }

    function deployCollectibleAuth() internal {
        console2.log("Phase 3: Deploying Collectible Authentication Platform...");

        vm.startBroadcast(deployer);

        collectibleAuthDeployment = CollectibleAuthDeploymentLib.deployContracts(
            proxyAdmin,
            luxDeployment.luxServiceManager,
            rewardsInitiator,
            deployer,
            collectibleAuthConfig
        );

        vm.stopBroadcast();

        // Save deployment data
        CollectibleAuthDeploymentLib.writeDeploymentJson(collectibleAuthDeployment);

        console2.log("Collectible Authentication Platform deployed successfully.");
    }
}
