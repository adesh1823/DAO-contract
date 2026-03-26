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
    mapping(address => bool) public hasExited;

    // Exit pool state
    uint256 public exitPool;
    uint256 public exitValuation;
    bool public exitOpen;

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

        startupToken = new StartupToken("Startup Equity Token", "SET", address(this));
    }

    // ── existing functions ────────────────────────────────────────────

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

    // ── exit functions ────────────────────────────────────────────────

    /// @dev Founder deposits ETH to open an exit window for investors.
    ///      exitValuation is the current valuation of the startup.
    ///      ETH received = (startupTokens held / totalSupply) * exitPool
    function openExit(uint256 _exitValuation) external payable {
        require(msg.sender == founder, "Only founder can open exit");
        require(!exitOpen, "Exit already open");
        require(msg.value > 0, "Must deposit ETH for exit pool");
        require(_exitValuation > 0, "Invalid exit valuation");

        exitPool = msg.value;
        exitValuation = _exitValuation;
        exitOpen = true;
    }

    /// @dev Investor burns their startup tokens and receives ETH
    ///      proportional to their ownership at the exit valuation.
    function exit() external {
        require(exitOpen, "Exit not open");
        require(!hasExited[msg.sender], "Already exited");

        uint256 investorTokens = startupToken.balanceOf(msg.sender);
        require(investorTokens > 0, "No startup tokens to exit");

        uint256 totalSupply = startupToken.totalSupply();

        uint256 ethAmount = (investorTokens * exitPool) / totalSupply;
        require(ethAmount > 0, "Nothing to claim");
        require(address(this).balance >= ethAmount, "Insufficient exit pool");

        // Burn tokens first — checks-effects-interactions pattern
        startupToken.burnFrom(msg.sender, investorTokens);
        hasExited[msg.sender] = true;
        exitPool -= ethAmount; // reduce pool after each exit to keep math correct

        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "Transfer failed");
    }

    /// @dev Founder closes exit and reclaims any unclaimed ETH
    ///      from investors who never called exit()
    function closeExit() external {
        require(msg.sender == founder, "Only founder can close exit");
        require(exitOpen, "No open exit");

        exitOpen = false;
        uint256 remaining = address(this).balance;

        if (remaining > 0) {
            (bool success, ) = founder.call{value: remaining}("");
            require(success, "Transfer failed");
        }
    }

    /// @dev View how much ETH an investor would receive if they exit now
    function getExitAmount(address investor) external view returns (uint256) {
        if (!exitOpen) return 0;
        uint256 investorTokens = startupToken.balanceOf(investor);
        if (investorTokens == 0) return 0;
        uint256 totalSupply = startupToken.totalSupply();
        return (investorTokens * exitPool) / totalSupply;
    }
}