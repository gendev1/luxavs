// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {LuxDeploymentLib} from "./utils/LuxDeploymentLib.sol";
import {CollectibleAuthDeploymentLib} from "./utils/CollectibleAuthDeploymentLib.sol";
import {CoreDeploymentLib} from "./utils/CoreDeploymentLib.sol";
import {UpgradeableProxyLib} from "./utils/UpgradeableProxyLib.sol";
import {StrategyBase} from "@eigenlayer/contracts/strategies/StrategyBase.sol";
import {ERC20Mock} from "../test/ERC20Mock.sol";
import {TransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {StrategyFactory} from "@eigenlayer/contracts/strategies/StrategyFactory.sol";
import {StrategyManager} from "@eigenlayer/contracts/core/StrategyManager.sol";
import {IRewardsCoordinator} from "@eigenlayer/contracts/interfaces/IRewardsCoordinator.sol";

import {
    Quorum,
    StrategyParams,
    IStrategy
} from "@eigenlayer-middleware/src/interfaces/IECDSAStakeRegistryEventsAndErrors.sol";

import "forge-std/Test.sol";

/// @title CollectibleAuthDeployer
/// @notice Deploys and configures the Collectible Authentication Platform
/// @dev Uses Foundry's Script for deployment automation
contract CollectibleAuthDeployer is Script, Test {
    using CoreDeploymentLib for *;
    using UpgradeableProxyLib for address;

    // ============ Deployment Variables ============
    address private deployer;
    address proxyAdmin;
    address rewardsOwner;
    address rewardsInitiator;
    IStrategy luxStrategy;
    CoreDeploymentLib.DeploymentData coreDeployment;
    LuxDeploymentLib.DeploymentData luxDeployment;
    CollectibleAuthDeploymentLib.DeploymentConfigData config;
    CollectibleAuthDeploymentLib.DeploymentData deployment;
    Quorum internal quorum;
    ERC20Mock token;

    /// @dev Setup deployment parameters from environment and config files
    function setUp() public virtual {
        deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        vm.label(deployer, "Deployer");

        // Read configuration for Collectible Authentication Platform deployment
        config = CollectibleAuthDeploymentLib.readDeploymentConfigValues(
            "config/collectible-auth/", block.chainid
        );

        // Read core EigenLayer deployment data
        coreDeployment = CoreDeploymentLib.readDeploymentJson("deployments/core/", block.chainid);

        // Read Lux service deployment data
        luxDeployment =
            LuxDeploymentLib.readDeploymentJson("deployments/lux-protocol/", block.chainid);
    }

    /// @dev Executes the deployment process
    function run() external {
        vm.startBroadcast(deployer);

        // Set rewards configuration
        rewardsOwner = config.rewardsOwner;
        rewardsInitiator = config.rewardsInitiator;

        // Deploy proxy admin for upgradeable contracts
        proxyAdmin = UpgradeableProxyLib.deployProxyAdmin();

        // Deploy Collectible Authentication Platform contracts
        deployment = CollectibleAuthDeploymentLib.deployContracts(
            proxyAdmin, luxDeployment.luxServiceManager, rewardsInitiator, deployer, config
        );

        vm.stopBroadcast();

        // Verify deployment and write deployment data to JSON
        verifyDeployment();
        CollectibleAuthDeploymentLib.writeDeploymentJson(deployment);
    }

    /// @dev Performs validation checks on the deployed contracts
    function verifyDeployment() internal view {
        require(
            deployment.collectibleRegistry != address(0),
            "CollectibleRegistry address cannot be zero"
        );
        require(
            deployment.nfcLuxuryMarketplace != address(0),
            "NFCLuxuryMarketplace address cannot be zero"
        );
        require(deployment.nfcCardFactory != address(0), "NFCCardFactory address cannot be zero");
        require(
            deployment.authenticationController != address(0),
            "AuthenticationController address cannot be zero"
        );
        require(proxyAdmin != address(0), "ProxyAdmin address cannot be zero");
        require(
            luxDeployment.luxServiceManager != address(0),
            "LuxServiceManager address cannot be zero"
        );
    }
}
