// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGovernanceToken {
    function mint(address to, uint256 amount) external;
    function delegate(address delegatee) external;
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);
}