// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {LuxDeploymentLib} from "./utils/LuxDeploymentLib.sol";
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

/// @title LuxServiceManager Deployment Script
/// @notice Deploys and configures the Lux Protocol AVS for document verification
/// @dev Uses Foundry's Script for deployment automation
contract LuxDeployer is Script, Test {
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
    LuxDeploymentLib.DeploymentConfigData luxConfig;
    Quorum internal quorum;
    ERC20Mock token;

    /// @dev Setup deployment parameters from environment and config files
    function setUp() public virtual {
        deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        vm.label(deployer, "Deployer");

        // Read configuration for Lux protocol deployment
        luxConfig =
            LuxDeploymentLib.readDeploymentConfigValues("config/lux-protocol/", block.chainid);

        // Read core EigenLayer deployment data
        coreDeployment = CoreDeploymentLib.readDeploymentJson("deployments/core/", block.chainid);
    }

    /// @dev Executes the deployment process
    function run() external {
        vm.startBroadcast(deployer);

        // Set rewards configuration
        rewardsOwner = luxConfig.rewardsOwner;
        rewardsInitiator = luxConfig.rewardsInitiator;

        // Deploy mock token and strategy for testing
        token = new ERC20Mock();
        luxStrategy =
            IStrategy(StrategyFactory(coreDeployment.strategyFactory).deployNewStrategy(token));

        // Configure quorum with strategy parameters
        quorum.strategies.push(StrategyParams({strategy: luxStrategy, multiplier: 10_000}));

        // Deploy proxy admin for upgradeable contracts
        proxyAdmin = UpgradeableProxyLib.deployProxyAdmin();

        // Deploy Lux Protocol contracts
        luxDeployment = LuxDeploymentLib.deployContracts(
            proxyAdmin, coreDeployment, quorum, rewardsInitiator, rewardsOwner
        );

        // Record deployed strategy and token addresses
        luxDeployment.strategy = address(luxStrategy);
        luxDeployment.token = address(token);

        vm.stopBroadcast();

        // Verify deployment and write deployment data to JSON
        verifyDeployment();
        LuxDeploymentLib.writeDeploymentJson(luxDeployment);
    }

    /// @dev Performs validation checks on the deployed contracts
    function verifyDeployment() internal view {
        require(luxDeployment.stakeRegistry != address(0), "StakeRegistry address cannot be zero");
        require(
            luxDeployment.luxServiceManager != address(0),
            "LuxServiceManager address cannot be zero"
        );
        require(luxDeployment.strategy != address(0), "Strategy address cannot be zero");
        require(proxyAdmin != address(0), "ProxyAdmin address cannot be zero");
        require(
            coreDeployment.delegationManager != address(0),
            "DelegationManager address cannot be zero"
        );
        require(coreDeployment.avsDirectory != address(0), "AVSDirectory address cannot be zero");
    }
}
