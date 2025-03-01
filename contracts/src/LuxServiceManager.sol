// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ECDSAServiceManagerBase} from
    "@eigenlayer-middleware/src/unaudited/ECDSAServiceManagerBase.sol";
import {ECDSAStakeRegistry} from "@eigenlayer-middleware/src/unaudited/ECDSAStakeRegistry.sol";
import {IServiceManager} from "@eigenlayer-middleware/src/interfaces/IServiceManager.sol";
import {ECDSAUpgradeable} from
    "@openzeppelin-upgrades/contracts/utils/cryptography/ECDSAUpgradeable.sol";
import {IERC1271Upgradeable} from
    "@openzeppelin-upgrades/contracts/interfaces/IERC1271Upgradeable.sol";
import {ILuxServiceManager} from "./ILuxServiceManager.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@eigenlayer/contracts/interfaces/IRewardsCoordinator.sol";
import {TransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/// @title LuxServiceManager
/// @notice Primary entrypoint for procuring services from Lux Protocol
/// @dev Implements the ILuxServiceManager interface for managing document processing tasks
contract LuxServiceManager is ECDSAServiceManagerBase, ILuxServiceManager {
    using ECDSAUpgradeable for bytes32;

    // ============ Storage ============

    /// @dev Latest task number in the sequence
    uint32 public latestTaskNum;

    /// @dev Mapping of task indices to task hashes. Task hash is stored when created,
    /// and responses must pass the actual task which is hashed onchain and verified.
    mapping(uint32 => bytes32) public allTaskHashes;

    /// @dev Mapping of operator addresses and task indices to response data
    mapping(address => mapping(uint32 => bytes)) public allTaskResponses;

    // ============ Errors ============

    /// @dev Thrown when task response verification fails
    error TaskResponseInvalid();

    /// @dev Thrown when operator attempts duplicate response
    error DuplicateResponse();

    /// @dev Thrown when task data doesn't match stored hash
    error TaskMismatch();

    // ============ Modifiers ============

    /// @dev Ensures caller is a registered operator
    modifier onlyOperator() {
        if (!ECDSAStakeRegistry(stakeRegistry).operatorRegistered(msg.sender)) {
            revert("Operator must be the caller");
        }
        _;
    }

    // ============ Constructor ============

    /// @dev Constructor initializes base contracts
    /// @param _avsDirectory The AVS directory address
    /// @param _stakeRegistry The stake registry address
    /// @param _rewardsCoordinator The rewards coordinator address
    /// @param _delegationManager The delegation manager address
    constructor(
        address _avsDirectory,
        address _stakeRegistry,
        address _rewardsCoordinator,
        address _delegationManager
    )
        ECDSAServiceManagerBase(_avsDirectory, _stakeRegistry, _rewardsCoordinator, _delegationManager)
    {}

    // ============ Initializer ============

    /// @dev Initializes the contract after deployment
    /// @param initialOwner The initial owner address
    /// @param _rewardsInitiator The rewards initiator address
    function initialize(address initialOwner, address _rewardsInitiator) external initializer {
        __ServiceManagerBase_init(initialOwner, _rewardsInitiator);
    }

    // ============ External Functions ============

    /// @inheritdoc ILuxServiceManager
    function createNewTask(
        bytes32 imageHash,
        bytes32 metadataHash,
        uint8 documentType
    ) external returns (Task memory) {
        Task memory newTask = Task({
            imageHash: imageHash,
            metadataHash: metadataHash,
            documentType: documentType,
            taskCreatedBlock: uint32(block.number)
        });

        bytes32 taskHash = _computeTaskHash(newTask);
        uint32 taskIndex = latestTaskNum;

        allTaskHashes[taskIndex] = taskHash;
        emit NewTaskCreated(taskIndex, newTask);

        unchecked {
            latestTaskNum = taskIndex + 1;
        }

        return newTask;
    }

    /// @inheritdoc ILuxServiceManager
    function respondToTask(
        Task calldata task,
        uint32 referenceTaskIndex,
        bytes calldata signature
    ) external onlyOperator {
        // Validate task and check for duplicate responses
        if (_computeTaskHash(task) != allTaskHashes[referenceTaskIndex]) {
            revert TaskMismatch();
        }
        if (allTaskResponses[msg.sender][referenceTaskIndex].length > 0) {
            revert DuplicateResponse();
        }

        // Verify signature
        bytes32 messageHash = _computeMessageHash(task);
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        if (!_isValidSignature(ethSignedMessageHash, signature)) {
            revert TaskResponseInvalid();
        }

        // Store response and emit event
        allTaskResponses[msg.sender][referenceTaskIndex] = signature;
        emit TaskResponded(referenceTaskIndex, task, msg.sender);
    }

    // ============ Internal Functions ============

    /// @dev Computes the hash of a task
    /// @param task The task to hash
    /// @return The computed hash
    function _computeTaskHash(
        Task memory task
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(task));
    }

    /// @dev Computes the message hash for signature verification
    /// @param task The task data
    /// @return The computed message hash
    function _computeMessageHash(
        Task memory task
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(task.imageHash, task.metadataHash, task.documentType));
    }

    /// @dev Validates a signature using the stake registry
    /// @param messageHash The hash of the message that was signed
    /// @param signature The signature to validate
    /// @return valid Whether the signature is valid
    function _isValidSignature(
        bytes32 messageHash,
        bytes memory signature
    ) internal view returns (bool) {
        return IERC1271Upgradeable.isValidSignature.selector
            == ECDSAStakeRegistry(stakeRegistry).isValidSignature(messageHash, signature);
    }
}
