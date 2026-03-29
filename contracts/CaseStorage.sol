// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CaseStorage {
    mapping(uint256 => bytes32) public caseHashes;

    event HashStored(uint256 indexed caseId, bytes32 hash);

    function storeHash(uint256 caseId, bytes32 hash) public {
        require(caseHashes[caseId] == 0, "Already stored");
        caseHashes[caseId] = hash;
        emit HashStored(caseId, hash);
    }

    function getHash(uint256 caseId) public view returns (bytes32) {
        return caseHashes[caseId];
    }
}
