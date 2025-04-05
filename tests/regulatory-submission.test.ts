import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts

// Constants for submission status
const STATUS_SUBMITTED = 1;
const STATUS_UNDER_REVIEW = 2;
const STATUS_ADDITIONAL_INFO_REQUESTED = 3;
const STATUS_APPROVED = 4;
const STATUS_REJECTED = 5;

// Mock state
let mockState = {
  regulatorySubmissions: {},
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
};

// Mock contract functions
const regulatorySubmission = {
  createSubmission: (submissionId, designId, testIds, regulatoryBody, comments, sender) => {
    if (mockState.regulatorySubmissions[submissionId]) {
      return { error: 1 };
    }
    
    mockState.regulatorySubmissions[submissionId] = {
      designId,
      testIds,
      regulatoryBody,
      submissionDate: 100, // Mock block height
      status: STATUS_SUBMITTED,
      statusUpdateDate: 100, // Mock block height
      approvalId: null,
      comments
    };
    
    return { success: true };
  },
  
  updateSubmissionStatus: (submissionId, newStatus, comments, approvalId, sender) => {
    if (sender !== mockState.admin) {
      return { error: 2 };
    }
    
    if (!mockState.regulatorySubmissions[submissionId]) {
      return { error: 3 };
    }
    
    if (newStatus < STATUS_SUBMITTED || newStatus > STATUS_REJECTED) {
      return { error: 4 };
    }
    
    mockState.regulatorySubmissions[submissionId].status = newStatus;
    mockState.regulatorySubmissions[submissionId].statusUpdateDate = 200; // Mock block height
    mockState.regulatorySubmissions[submissionId].approvalId = approvalId;
    mockState.regulatorySubmissions[submissionId].comments = comments;
    
    return { success: true };
  },
  
  getSubmissionDetails: (submissionId) => {
    return mockState.regulatorySubmissions[submissionId] || null;
  },
  
  getSubmissionStatus: (submissionId) => {
    if (!mockState.regulatorySubmissions[submissionId]) {
      return { error: 5 };
    }
    
    return { success: mockState.regulatorySubmissions[submissionId].status };
  },
  
  transferAdmin: (newAdmin, sender) => {
    if (sender !== mockState.admin) {
      return { error: 6 };
    }
    
    mockState.admin = newAdmin;
    return { success: true };
  }
};

describe('Regulatory Submission Contract', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockState = {
      regulatorySubmissions: {},
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    };
  });
  
  it('should create a new regulatory submission', () => {
    const result = regulatorySubmission.createSubmission(
        'sub-123',
        'design-456',
        ['test-789', 'test-101'],
        'FDA',
        'Initial submission for 510(k) clearance',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result.success).toBe(true);
    expect(mockState.regulatorySubmissions['sub-123']).toBeDefined();
    expect(mockState.regulatorySubmissions['sub-123'].status).toBe(STATUS_SUBMITTED);
  });
  
  it('should not create a submission with an existing ID', () => {
    regulatorySubmission.createSubmission(
        'sub-123',
        'design-456',
        ['test-789', 'test-101'],
        'FDA',
        'Initial submission for 510(k) clearance',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const result = regulatorySubmission.createSubmission(
        'sub-123',
        'design-789',
        ['test-102'],
        'EMA',
        'European submission',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result.error).toBe(1);
  });
  
  it('should update submission status when called by admin', () => {
    regulatorySubmission.createSubmission(
        'sub-123',
        'design-456',
        ['test-789', 'test-101'],
        'FDA',
        'Initial submission for 510(k) clearance',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const result = regulatorySubmission.updateSubmissionStatus(
        'sub-123',
        STATUS_UNDER_REVIEW,
        'Submission is now under review',
        null,
        mockState.admin
    );
    
    expect(result.success).toBe(true);
    expect(mockState.regulatorySubmissions['sub-123'].status).toBe(STATUS_UNDER_REVIEW);
  });
  
  it('should not update submission status when called by non-admin', () => {
    regulatorySubmission.createSubmission(
        'sub-123',
        'design-456',
        ['test-789', 'test-101'],
        'FDA',
        'Initial submission for 510(k) clearance',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const nonAdmin = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const result = regulatorySubmission.updateSubmissionStatus(
        'sub-123',
        STATUS_UNDER_REVIEW,
        'Submission is now under review',
        null,
        nonAdmin
    );
    
    expect(result.error).toBe(2);
    expect(mockState.regulatorySubmissions['sub-123'].status).toBe(STATUS_SUBMITTED);
  });
  
  it('should approve a submission with an approval ID', () => {
    regulatorySubmission.createSubmission(
        'sub-123',
        'design-456',
        ['test-789', 'test-101'],
        'FDA',
        'Initial submission for 510(k) clearance',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const result = regulatorySubmission.updateSubmissionStatus(
        'sub-123',
        STATUS_APPROVED,
        'Submission approved',
        'FDA-2023-123456',
        mockState.admin
    );
    
    expect(result.success).toBe(true);
    expect(mockState.regulatorySubmissions['sub-123'].status).toBe(STATUS_APPROVED);
    expect(mockState.regulatorySubmissions['sub-123'].approvalId).toBe('FDA-2023-123456');
  });
  
  it('should get submission status', () => {
    regulatorySubmission.createSubmission(
        'sub-123',
        'design-456',
        ['test-789', 'test-101'],
        'FDA',
        'Initial submission for 510(k) clearance',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const result = regulatorySubmission.getSubmissionStatus('sub-123');
    
    expect(result.success).toBe(STATUS_SUBMITTED);
  });
});
