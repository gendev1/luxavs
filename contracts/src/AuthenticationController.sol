// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./ILuxServiceManager.sol";
import "./CollectibleRegistry.sol";

/**
 * @title AuthenticationController
 * @dev Mediates between LuxServiceManager and CollectibleRegistry
 * Handles the authentication workflow and forwards results to the registry
 */
contract AuthenticationController is AccessControl, Initializable, ReentrancyGuard {
    // Custom errors
    error NotAuthorized();
    error TaskAlreadyProcessed(uint32 taskIndex);
    error InvalidTaskData(uint32 taskIndex);
    error InsufficientConfidence(uint8 provided, uint8 required);
    error RegistryCallFailed(uint32 taskIndex);
    error ZeroAddress();
    error TooManyConfirmations(uint32 taskIndex);
    error ConsensusNotReached(uint32 taskIndex);

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    ILuxServiceManager public serviceManager;
    CollectibleRegistry public registry;

    // Configuration
    uint8 public confidenceThreshold = 75; // Default confidence threshold for authentication
    uint256 public requiredConfirmations = 2; // Number of confirmations needed

    // Mapping to track tasks
    mapping(uint32 => bool) public processedTasks;
    
    // Multi-authenticator consensus
    mapping(uint32 => mapping(address => bool)) private _authenticatorConfirmations;
    mapping(uint32 => uint256) private _confirmationCount;
    mapping(uint32 => mapping(address => bool)) private _authenticityVotes;
    mapping(uint32 => uint256) private _authenticVoteCount;
    mapping(uint32 => uint256) private _inauthenticVoteCount;

    // Events
    event AuthenticationReceived(uint32 taskIndex, bool isAuthentic, address authenticator, uint8 confidence);
    event AuthenticationCompleted(uint32 taskIndex, bool isAuthentic);
    event AuthenticationConfirmation(uint32 taskIndex, address authenticator, bool authenticity, uint8 confidence);
    event ManualAuthenticationOverride(uint32 taskIndex, bool authenticity, address admin);
    event ConfidenceThresholdUpdated(uint8 oldThreshold, uint8 newThreshold);
    event RequiredConfirmationsUpdated(uint256 oldValue, uint256 newValue);

    /**
     * @dev Constructor to set up roles and contract references
     */
    constructor(address _serviceManager, address _registry) {
        if (_serviceManager == address(0) || _registry == address(0)) revert ZeroAddress();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        serviceManager = ILuxServiceManager(_serviceManager);
        registry = CollectibleRegistry(_registry);
    }

    /**
     * @dev Initializes the contract (used with proxy pattern)
     */
    function initialize(
        address admin,
        address _serviceManager,
        address _registry,
        uint8 _confidenceThreshold,
        uint256 _requiredConfirmations
    ) external initializer {
        if (admin == address(0) || _serviceManager == address(0) || _registry == address(0)) 
            revert ZeroAddress();
            
        if (_confidenceThreshold < 50 || _confidenceThreshold > 100)
            revert InsufficientConfidence(_confidenceThreshold, 50);
            
        if (_requiredConfirmations == 0)
            revert InvalidTaskData(0);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        
        serviceManager = ILuxServiceManager(_serviceManager);
        registry = CollectibleRegistry(_registry);
        
        confidenceThreshold = _confidenceThreshold;
        requiredConfirmations = _requiredConfirmations;
    }

    /**
     * @dev Set contract references
     */
    function setContractReferences(
        address _serviceManager,
        address _registry
    ) external onlyRole(ADMIN_ROLE) {
        if (_serviceManager == address(0) || _registry == address(0)) revert ZeroAddress();
        
        serviceManager = ILuxServiceManager(_serviceManager);
        registry = CollectibleRegistry(_registry);
    }

    /**
     * @dev Set confidence threshold
     */
    function setConfidenceThreshold(uint8 _threshold) external onlyRole(ADMIN_ROLE) {
        if (_threshold < 50 || _threshold > 100)
            revert InsufficientConfidence(_threshold, 50);
            
        uint8 oldThreshold = confidenceThreshold;
        confidenceThreshold = _threshold;
        
        emit ConfidenceThresholdUpdated(oldThreshold, _threshold);
    }
    
    /**
     * @dev Set required confirmations
     */
    function setRequiredConfirmations(uint256 _requiredConfirmations) external onlyRole(ADMIN_ROLE) {
        if (_requiredConfirmations == 0)
            revert InvalidTaskData(0);
            
        uint256 oldValue = requiredConfirmations;
        requiredConfirmations = _requiredConfirmations;
        
        emit RequiredConfirmationsUpdated(oldValue, _requiredConfirmations);
    }

    /**
     * @dev Grant operator role to an address
     */
    function addOperator(
        address operator
    ) external onlyRole(ADMIN_ROLE) {
        if (operator == address(0)) revert ZeroAddress();
        grantRole(OPERATOR_ROLE, operator);
    }

    /**
     * @dev Remove operator role from an address
     */
    function removeOperator(
        address operator
    ) external onlyRole(ADMIN_ROLE) {
        revokeRole(OPERATOR_ROLE, operator);
    }

    /**
     * @dev Process authentication response from LuxServiceManager
     * @param taskIndex Index of the completed task
     * @param task The task data
     * @param authenticity Whether the item is authentic (true) or not (false)
     * @param confidence Confidence score of the authentication (0-100)
     * @param additionalData Any additional authentication data (IPFS hash to full report)
     */
    function processAuthentication(
        uint32 taskIndex,
        ILuxServiceManager.Task calldata task,
        bool authenticity,
        uint8 confidence,
        string calldata additionalData
    ) external nonReentrant onlyRole(OPERATOR_ROLE) {
        // Verify task with ServiceManager
        bytes32 taskHash = keccak256(abi.encode(task));
        if (serviceManager.allTaskHashes(taskIndex) != taskHash) 
            revert InvalidTaskData(taskIndex);
        
        // Check confidence threshold
        if (confidence < confidenceThreshold)
            revert InsufficientConfidence(confidence, confidenceThreshold);
        
        // Check if this authenticator has already confirmed
        if (_authenticatorConfirmations[taskIndex][msg.sender])
            revert TaskAlreadyProcessed(taskIndex);
            
        // Record this authenticator's confirmation
        _authenticatorConfirmations[taskIndex][msg.sender] = true;
        _confirmationCount[taskIndex]++;
        
        // Record authenticator's vote on authenticity
        _authenticityVotes[taskIndex][msg.sender] = authenticity;
        if (authenticity) {
            _authenticVoteCount[taskIndex]++;
        } else {
            _inauthenticVoteCount[taskIndex]++;
        }
        
        // Emit event for this confirmation
        emit AuthenticationConfirmation(taskIndex, msg.sender, authenticity, confidence);
        
        // Check if we have enough confirmations
        if (_confirmationCount[taskIndex] >= requiredConfirmations && !processedTasks[taskIndex]) {
            // Determine consensus result
            bool consensusAuthenticity = _authenticVoteCount[taskIndex] > _inauthenticVoteCount[taskIndex];
            
            // Mark task as processed
            processedTasks[taskIndex] = true;
            
            // Forward to registry
            try registry.onAuthenticationComplete(taskIndex, consensusAuthenticity, msg.sender) {
                // Emit event
                emit AuthenticationCompleted(taskIndex, consensusAuthenticity);
            } catch {
                revert RegistryCallFailed(taskIndex);
            }
        }
        
        // Even if we don't have enough votes yet, record this vote
        emit AuthenticationReceived(taskIndex, authenticity, msg.sender, confidence);
    }

    /**
     * @dev Allows the admin to manually trigger authentication status update
     * in case of disputes or verification issues
     */
    function manualAuthenticationOverride(
        uint32 taskIndex,
        bool authenticity
    ) external nonReentrant onlyRole(ADMIN_ROLE) {
        // Get task from service manager to verify it exists
        try serviceManager.getTask(taskIndex) returns (ILuxServiceManager.Task memory) {
            // Valid task, continue with override
        } catch {
            revert InvalidTaskData(taskIndex);
        }
        
        // Check if already processed
        if (processedTasks[taskIndex]) 
            revert TaskAlreadyProcessed(taskIndex);
            
        // Mark as processed
        processedTasks[taskIndex] = true;

        // Forward to registry
        try registry.onAuthenticationComplete(taskIndex, authenticity, msg.sender) {
            // Emit events
            emit ManualAuthenticationOverride(taskIndex, authenticity, msg.sender);
            emit AuthenticationCompleted(taskIndex, authenticity);
        } catch {
            revert RegistryCallFailed(taskIndex);
        }
    }
    
    /**
     * @dev Get authentication status
     * @param taskIndex Index of the task
     * @return processed Whether the task has been processed
     * @return confirmations Number of confirmations received
     * @return authenticVotes Number of votes confirming authenticity
     * @return inauthenticVotes Number of votes rejecting authenticity
     */
    function getAuthenticationStatus(uint32 taskIndex) external view returns (
        bool processed,
        uint256 confirmations,
        uint256 authenticVotes,
        uint256 inauthenticVotes
    ) {
        return (
            processedTasks[taskIndex],
            _confirmationCount[taskIndex],
            _authenticVoteCount[taskIndex],
            _inauthenticVoteCount[taskIndex]
        );
    }
}