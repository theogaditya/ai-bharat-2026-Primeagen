import { expect } from "chai";
import { ethers } from "hardhat";
import { GrievanceContract } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GrievanceContract", function () {
  let contract: GrievanceContract;
  let owner: HardhatEthersSigner;
  let citizen: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, citizen] = await ethers.getSigners();
    
    const GrievanceContract = await ethers.getContractFactory("GrievanceContract");
    contract = await GrievanceContract.deploy();
    await contract.waitForDeployment();
  });

  describe("Register Complaint", function () {
    it("Should register a new complaint", async function () {
      const complaintId = "COMP-001";
      const category = "Infrastructure";
      const subcategory = "Road Repair";
      const urgency = "high";
      const descHash = "abc123hash";
      const attachHash = "xyz789hash";

      await contract.registerComplaint(
        complaintId,
        category,
        subcategory,
        urgency,
        descHash,
        attachHash,
        citizen.address
      );

      const complaint = await contract.getComplaint(complaintId);
      expect(complaint.complaintId).to.equal(complaintId);
      expect(complaint.category).to.equal(category);
      expect(complaint.urgency).to.equal(urgency);
      expect(complaint.status).to.equal("open");
      expect(complaint.submittedBy).to.equal(citizen.address);
    });

    it("Should not allow duplicate complaint IDs", async function () {
      const complaintId = "COMP-002";
      
      await contract.registerComplaint(
        complaintId,
        "Sanitation",
        "Garbage Collection",
        "medium",
        "hash1",
        "hash2",
        citizen.address
      );

      await expect(
        contract.registerComplaint(
          complaintId,
          "Water",
          "Supply Issue",
          "high",
          "hash3",
          "hash4",
          citizen.address
        )
      ).to.be.revertedWith("Complaint already exists");
    });

    it("Should emit ComplaintRegistered event", async function () {
      const complaintId = "COMP-003";
      
      await expect(
        contract.registerComplaint(
          complaintId,
          "Healthcare",
          "Hospital Services",
          "critical",
          "hash1",
          "hash2",
          citizen.address
        )
      )
        .to.emit(contract, "ComplaintRegistered")
        .withArgs(complaintId, "Healthcare", "critical", citizen.address, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
    });
  });

  describe("Update Status", function () {
    beforeEach(async function () {
      await contract.registerComplaint(
        "COMP-004",
        "Electricity",
        "Power Outage",
        "high",
        "hash1",
        "hash2",
        citizen.address
      );
    });

    it("Should update complaint status", async function () {
      await contract.updateStatus("COMP-004", "in_progress");
      
      const complaint = await contract.getComplaint("COMP-004");
      expect(complaint.status).to.equal("in_progress");
    });

    it("Should emit ComplaintStatusUpdated event", async function () {
      await expect(contract.updateStatus("COMP-004", "resolved"))
        .to.emit(contract, "ComplaintStatusUpdated");
    });

    it("Should revert for non-existent complaint", async function () {
      await expect(
        contract.updateStatus("COMP-999", "resolved")
      ).to.be.revertedWith("Complaint does not exist");
    });
  });

  describe("Assign Complaint", function () {
    beforeEach(async function () {
      await contract.registerComplaint(
        "COMP-005",
        "Education",
        "School Infrastructure",
        "medium",
        "hash1",
        "hash2",
        citizen.address
      );
    });

    it("Should assign complaint to department", async function () {
      const departmentId = "DEPT-PWD-001";
      
      await contract.assignComplaint("COMP-005", departmentId);
      
      const complaint = await contract.getComplaint("COMP-005");
      expect(complaint.assignedTo).to.equal(departmentId);
      expect(complaint.status).to.equal("in_progress");
    });

    it("Should emit ComplaintAssigned event", async function () {
      await expect(contract.assignComplaint("COMP-005", "DEPT-HEALTH"))
        .to.emit(contract, "ComplaintAssigned");
    });
  });

  describe("Resolve Complaint", function () {
    beforeEach(async function () {
      await contract.registerComplaint(
        "COMP-006",
        "Transport",
        "Bus Service",
        "low",
        "hash1",
        "hash2",
        citizen.address
      );
    });

    it("Should resolve complaint", async function () {
      const resolutionDate = "2024-12-02";
      
      await contract.resolveComplaint("COMP-006", resolutionDate);
      
      const complaint = await contract.getComplaint("COMP-006");
      expect(complaint.status).to.equal("resolved");
      expect(complaint.resolutionDate).to.equal(resolutionDate);
    });

    it("Should emit ComplaintResolved event", async function () {
      await expect(contract.resolveComplaint("COMP-006", "2024-12-02"))
        .to.emit(contract, "ComplaintResolved");
    });
  });

  describe("Query Functions", function () {
    it("Should get complaint count", async function () {
      await contract.registerComplaint("C1", "Cat1", "Sub1", "low", "h1", "h2", citizen.address);
      await contract.registerComplaint("C2", "Cat2", "Sub2", "medium", "h3", "h4", citizen.address);
      
      const count = await contract.getComplaintCount();
      expect(count).to.equal(2);
    });

    it("Should get complaint by index", async function () {
      await contract.registerComplaint("C-INDEX", "Cat", "Sub", "high", "h1", "h2", citizen.address);
      
      const id = await contract.getComplaintIdByIndex(0);
      expect(id).to.equal("C-INDEX");
    });

    it("Should verify complaint hash", async function () {
      const descHash = "unique-hash-123";
      await contract.registerComplaint("C-HASH", "Cat", "Sub", "low", descHash, "h2", citizen.address);
      
      const isValid = await contract.verifyComplaintHash("C-HASH", descHash);
      expect(isValid).to.be.true;
    });
  });
});
