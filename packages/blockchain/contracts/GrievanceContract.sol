// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GrievanceContractOptimized
 * @dev Gas-optimized version with reduced storage
 * Stores only critical data on-chain, full details in events
 */
contract GrievanceContractOptimized {
    
    // Location structure for users and complaints
    struct Location {
        string pin;             // PIN code
        string district;        // District name
        string city;            // City name
        string state;           // State name
        string municipal;       // Municipal area (for users)
        string locality;        // Locality name
    }
    
    // Simplified User structure
    struct User {
        bytes32 emailHash;      // 32 bytes
        bytes32 aadhaarHash;    // 32 bytes
        bytes32 locationHash;   // 32 bytes - hash of location for verification
        uint64 registrationDate; // 8 bytes
        bool isActive;          // 1 byte
    }
    
    // Simplified Complaint structure
    struct Complaint {
        bytes32 complainantIdHash;  // Hash of complainant ID
        bytes32 descriptionHash;    // Hash of description
        bytes32 attachmentHash;     // Hash of attachment
        bytes32 locationHash;       // Hash of location for verification
        uint64 submissionDate;      // 8 bytes
        uint64 lastUpdated;         // 8 bytes
        uint32 upvoteCount;         // 4 bytes
        uint8 urgencyLevel;         // 1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL
        uint8 statusCode;           // 1=REGISTERED, 2=PROCESSING, 3=COMPLETED, etc.
        bool isPublic;              // 1 byte
    }
    
    // Mappings - using bytes32 for gas efficiency
    mapping(bytes32 => User) public users;
    mapping(bytes32 => Complaint) public complaints;
    mapping(bytes32 => bool) public userExists;
    mapping(bytes32 => bool) public complaintExists;
    
    // Counters
    uint256 public totalUsers;
    uint256 public totalComplaints;
    uint256 public totalAuditLogs;
    
    // Events store full data (cheaper than storage)
    event UserRegistered(
        string indexed userId,
        string name,
        string role,
        bytes32 emailHash,
        bytes32 aadhaarHash,
        bytes32 locationHash,
        uint256 timestamp
    );
    
    // Separate event for full location details (gas efficient - stored in logs)
    event UserLocationStored(
        string indexed userId,
        string pin,
        string district,
        string city,
        string state,
        string municipal,
        uint256 timestamp
    );
    
    event ComplaintRegistered(
        string indexed complaintId,
        string indexed complainantId,
        string categoryId,
        string subCategory,
        string department,
        uint8 urgency,
        bytes32 descriptionHash,
        bytes32 attachmentHash,
        bytes32 locationHash,
        bool isPublic,
        uint256 timestamp
    );
    
    // Separate event for complaint location details
    event ComplaintLocationStored(
        string indexed complaintId,
        string pin,
        string district,
        string city,
        string locality,
        string state,
        uint256 timestamp
    );
    
    event ComplaintStatusUpdated(
        string indexed complaintId,
        uint8 oldStatus,
        uint8 newStatus,
        string statusName,
        uint256 timestamp
    );
    
    event ComplaintAssigned(
        string indexed complaintId,
        string assignedTo,
        uint256 timestamp
    );
    
    event ComplaintResolved(
        string indexed complaintId,
        uint256 timestamp
    );
    
    event AuditLogCreated(
        string indexed logId,
        string action,
        string userId,
        string complaintId,
        string details,
        uint256 timestamp
    );
    
    event UpvoteAdded(
        string indexed complaintId,
        uint32 newCount,
        uint256 timestamp
    );
    
    /**
     * @dev Register a new user with location
     * Full details in event, only hashes stored
     */
    function registerUser(
        string calldata _userId,
        string calldata _name,
        string calldata _role,
        bytes32 _emailHash,
        bytes32 _aadhaarHash,
        bytes32 _locationHash,
        string calldata _pin,
        string calldata _district,
        string calldata _city,
        string calldata _state,
        string calldata _municipal
    ) external {
        bytes32 userIdHash = keccak256(bytes(_userId));
        require(!userExists[userIdHash], "User already exists");
        
        users[userIdHash] = User({
            emailHash: _emailHash,
            aadhaarHash: _aadhaarHash,
            locationHash: _locationHash,
            registrationDate: uint64(block.timestamp),
            isActive: true
        });
        
        userExists[userIdHash] = true;
        totalUsers++;
        
        emit UserRegistered(
            _userId,
            _name,
            _role,
            _emailHash,
            _aadhaarHash,
            _locationHash,
            block.timestamp
        );
        
        // Emit location details separately
        emit UserLocationStored(
            _userId,
            _pin,
            _district,
            _city,
            _state,
            _municipal,
            block.timestamp
        );
    }
    
    /**
     * @dev Register a new complaint with location
     */
    function registerComplaint(
        string calldata _complaintId,
        string calldata _complainantId,
        string calldata _categoryId,
        string calldata _subCategory,
        string calldata _department,
        uint8 _urgency,
        bytes32 _descriptionHash,
        bytes32 _attachmentHash,
        bytes32 _locationHash,
        bool _isPublic,
        string calldata _pin,
        string calldata _district,
        string calldata _city,
        string calldata _locality,
        string calldata _state
    ) external {
        bytes32 complaintIdHash = keccak256(bytes(_complaintId));
        require(!complaintExists[complaintIdHash], "Complaint already exists");
        require(_urgency >= 1 && _urgency <= 4, "Invalid urgency");
        
        complaints[complaintIdHash] = Complaint({
            complainantIdHash: keccak256(bytes(_complainantId)),
            descriptionHash: _descriptionHash,
            attachmentHash: _attachmentHash,
            locationHash: _locationHash,
            submissionDate: uint64(block.timestamp),
            lastUpdated: uint64(block.timestamp),
            upvoteCount: 0,
            urgencyLevel: _urgency,
            statusCode: 1, // REGISTERED
            isPublic: _isPublic
        });
        
        complaintExists[complaintIdHash] = true;
        totalComplaints++;
        
        emit ComplaintRegistered(
            _complaintId,
            _complainantId,
            _categoryId,
            _subCategory,
            _department,
            _urgency,
            _descriptionHash,
            _attachmentHash,
            _locationHash,
            _isPublic,
            block.timestamp
        );
        
        // Emit location details separately
        emit ComplaintLocationStored(
            _complaintId,
            _pin,
            _district,
            _city,
            _locality,
            _state,
            block.timestamp
        );
    }
    
    /**
     * @dev Update complaint status
     */
    function updateComplaintStatus(
        string calldata _complaintId,
        uint8 _newStatus,
        string calldata _statusName
    ) external {
        bytes32 complaintIdHash = keccak256(bytes(_complaintId));
        require(complaintExists[complaintIdHash], "Complaint does not exist");
        require(_newStatus >= 1 && _newStatus <= 9, "Invalid status");
        
        Complaint storage complaint = complaints[complaintIdHash];
        uint8 oldStatus = complaint.statusCode;
        
        complaint.statusCode = _newStatus;
        complaint.lastUpdated = uint64(block.timestamp);
        
        emit ComplaintStatusUpdated(
            _complaintId,
            oldStatus,
            _newStatus,
            _statusName,
            block.timestamp
        );
    }
    
    /**
     * @dev Assign complaint
     */
    function assignComplaint(
        string calldata _complaintId,
        string calldata _assignedTo
    ) external {
        bytes32 complaintIdHash = keccak256(bytes(_complaintId));
        require(complaintExists[complaintIdHash], "Complaint does not exist");
        
        Complaint storage complaint = complaints[complaintIdHash];
        complaint.statusCode = 2; // UNDER_PROCESSING
        complaint.lastUpdated = uint64(block.timestamp);
        
        emit ComplaintAssigned(_complaintId, _assignedTo, block.timestamp);
    }
    
    /**
     * @dev Resolve complaint
     */
    function resolveComplaint(string calldata _complaintId) external {
        bytes32 complaintIdHash = keccak256(bytes(_complaintId));
        require(complaintExists[complaintIdHash], "Complaint does not exist");
        
        Complaint storage complaint = complaints[complaintIdHash];
        complaint.statusCode = 5; // COMPLETED
        complaint.lastUpdated = uint64(block.timestamp);
        
        emit ComplaintResolved(_complaintId, block.timestamp);
    }
    
    /**
     * @dev Update upvote count
     */
    function updateUpvoteCount(
        string calldata _complaintId,
        uint32 _newCount
    ) external {
        bytes32 complaintIdHash = keccak256(bytes(_complaintId));
        require(complaintExists[complaintIdHash], "Complaint does not exist");
        
        complaints[complaintIdHash].upvoteCount = _newCount;
        complaints[complaintIdHash].lastUpdated = uint64(block.timestamp);
        
        emit UpvoteAdded(_complaintId, _newCount, block.timestamp);
    }
    
    /**
     * @dev Create audit log (only emits event, doesn't store)
     * This saves massive gas costs
     */
    function createAuditLog(
        string calldata _logId,
        string calldata _action,
        string calldata _userId,
        string calldata _complaintId,
        string calldata _details
    ) external {
        totalAuditLogs++;
        
        emit AuditLogCreated(
            _logId,
            _action,
            _userId,
            _complaintId,
            _details,
            block.timestamp
        );
    }
    
    /**
     * @dev Get complaint by ID (returns struct)
     */
    function getComplaint(string calldata _complaintId) 
        external 
        view 
        returns (Complaint memory) 
    {
        bytes32 complaintIdHash = keccak256(bytes(_complaintId));
        require(complaintExists[complaintIdHash], "Complaint does not exist");
        return complaints[complaintIdHash];
    }
    
    /**
     * @dev Get user by ID (returns struct)
     */
    function getUser(string calldata _userId) 
        external 
        view 
        returns (User memory) 
    {
        bytes32 userIdHash = keccak256(bytes(_userId));
        require(userExists[userIdHash], "User does not exist");
        return users[userIdHash];
    }
    
    /**
     * @dev Get total counts
     */
    function getCounts() 
        external 
        view 
        returns (uint256 userCount, uint256 complaintCount, uint256 auditLogCount) 
    {
        return (totalUsers, totalComplaints, totalAuditLogs);
    }
    
    /**
     * @dev Verify complaint hash
     */
    function verifyHash(
        string calldata _complaintId,
        bytes32 _descriptionHash
    ) external view returns (bool) {
        bytes32 complaintIdHash = keccak256(bytes(_complaintId));
        require(complaintExists[complaintIdHash], "Complaint does not exist");
        
        return complaints[complaintIdHash].descriptionHash == _descriptionHash;
    }
    
    /**
     * @dev Check if user exists
     */
    function checkUserExists(string calldata _userId) external view returns (bool) {
        return userExists[keccak256(bytes(_userId))];
    }
    
    /**
     * @dev Check if complaint exists
     */
    function checkComplaintExists(string calldata _complaintId) external view returns (bool) {
        return complaintExists[keccak256(bytes(_complaintId))];
    }
}

/**
 * STATUS CODES:
 * 1 = REGISTERED
 * 2 = UNDER_PROCESSING
 * 3 = FORWARDED
 * 4 = ON_HOLD
 * 5 = COMPLETED
 * 6 = REJECTED
 * 7 = ESCALATED_MUNICIPAL
 * 8 = ESCALATED_STATE
 * 9 = DELETED
 * 
 * URGENCY LEVELS:
 * 1 = LOW
 * 2 = MEDIUM
 * 3 = HIGH
 * 4 = CRITICAL
 */