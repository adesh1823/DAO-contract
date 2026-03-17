// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StartupToken.sol";
import "./IGovernanceToken.sol";

contract StartupContract {

    address public founder;
    uint256 public valuation;
    uint256 public fundingAmount;

    IGovernanceToken public govToken;
    uint256 public snapshotBlock;
    uint256 public totalGovSupplySnapshot;

    StartupToken public startupToken;
    mapping(address => bool) public hasClaimed;

    constructor(
        address _founder,
        uint256 _valuation,
        uint256 _fundingAmount,
        address _govToken,
        uint256 _snapshotBlock
    ) payable {
        require(msg.value == _fundingAmount, "Funding mismatch");

        founder = _founder;
        valuation = _valuation;
        fundingAmount = _fundingAmount;

        govToken = IGovernanceToken(_govToken);
        snapshotBlock = _snapshotBlock;

        totalGovSupplySnapshot = govToken.getPastTotalSupply(snapshotBlock);

        // Deploy StartupToken, owned by this contract
        startupToken = new StartupToken("Startup Equity Token", "SET", address(this));
    }

    function claimTokens() external {
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 investorVotes = govToken.getPastVotes(msg.sender, snapshotBlock);
        require(investorVotes > 0, "No voting power at snapshot");

        uint256 tokenAmount = (investorVotes * valuation) / totalGovSupplySnapshot;
        startupToken.mint(msg.sender, tokenAmount);

        hasClaimed[msg.sender] = true;
    }

    function getStartupToken() external view returns (address) {
        return address(startupToken);
    }


    function withdrawFunding() external {
        require(msg.sender == founder, "Only founder can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

       (bool success, ) = founder.call{value: balance}("");
require(success, "Transfer failed");
    }
}