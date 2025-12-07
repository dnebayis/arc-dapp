// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArcNameRegistryV3 {
    mapping(bytes32 => address) public owners;
    mapping(bytes32 => address) public addrRecords;
    mapping(bytes32 => mapping(string => string)) private textRecords;

    event NameRegistered(bytes32 indexed node, address indexed owner);
    event AddrSet(bytes32 indexed node, address indexed addr);
    event TextSet(bytes32 indexed node, string key, string value);
    event OwnerTransferred(bytes32 indexed node, address indexed newOwner);

    function register(bytes32 node) external {
        require(owners[node] == address(0), "taken");
        owners[node] = msg.sender;
        emit NameRegistered(node, msg.sender);
    }

    function transfer(bytes32 node, address newOwner) external {
        require(owners[node] == msg.sender, "not owner");
        require(newOwner != address(0), "zero");
        owners[node] = newOwner;
        emit OwnerTransferred(node, newOwner);
    }

    function setAddr(bytes32 node, address addr_) external {
        require(owners[node] == msg.sender, "not owner");
        addrRecords[node] = addr_;
        emit AddrSet(node, addr_);
    }

    function setText(bytes32 node, string calldata key, string calldata value) external {
        require(owners[node] == msg.sender, "not owner");
        textRecords[node][key] = value;
        emit TextSet(node, key, value);
    }

    function getText(bytes32 node, string calldata key) external view returns (string memory) {
        return textRecords[node][key];
    }
}
