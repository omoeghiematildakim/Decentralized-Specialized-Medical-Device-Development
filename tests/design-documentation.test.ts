import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts

// Mock state
let mockState = {
  deviceDesigns: {},
  designVersions: {},
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
};

// Mock contract functions
const designDocumentation = {
  registerDesign: (designId, inventorId, name, description, specifications, documentationHash, sender) => {
    if (mockState.deviceDesigns[designId]) {
      return { error: 1 };
    }
    
    mockState.deviceDesigns[designId] = {
      inventorId,
      name,
      description,
      specifications,
      documentationHash,
      creationDate: 100, // Mock block height
      lastUpdated: 100, // Mock block height
      version: 1
    };
    
    return { success: true };
  },
  
  updateDesign: (designId, specifications, documentationHash, sender) => {
    if (!mockState.deviceDesigns[designId]) {
      return { error: 2 };
    }
    
    const currentDesign = mockState.deviceDesigns[designId];
    const currentVersion = currentDesign.version;
    
    // Store previous version
    const versionKey = `${designId}-${currentVersion}`;
    mockState.designVersions[versionKey] = {
      specifications: currentDesign.specifications,
      documentationHash: currentDesign.documentationHash,
      updateDate: currentDesign.lastUpdated
    };
    
    // Update current design
    mockState.deviceDesigns[designId] = {
      ...currentDesign,
      specifications,
      documentationHash,
      lastUpdated: 200, // Mock new block height
      version: currentVersion + 1
    };
    
    return { success: true };
  },
  
  getDesignDetails: (designId) => {
    return mockState.deviceDesigns[designId] || null;
  },
  
  getDesignVersion: (designId, version) => {
    const versionKey = `${designId}-${version}`;
    return mockState.designVersions[versionKey] || null;
  },
  
  transferAdmin: (newAdmin, sender) => {
    if (sender !== mockState.admin) {
      return { error: 5 };
    }
    
    mockState.admin = newAdmin;
    return { success: true };
  }
};

describe('Design Documentation Contract', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockState = {
      deviceDesigns: {},
      designVersions: {},
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    };
  });
  
  it('should register a new device design', () => {
    const result = designDocumentation.registerDesign(
        'design-123',
        'inv-456',
        'Cardiac Monitoring Device',
        'A wearable device for continuous cardiac monitoring',
        'Technical specifications for the cardiac monitoring device',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result.success).toBe(true);
    expect(mockState.deviceDesigns['design-123']).toBeDefined();
    expect(mockState.deviceDesigns['design-123'].version).toBe(1);
  });
  
  it('should not register a design with an existing ID', () => {
    designDocumentation.registerDesign(
        'design-123',
        'inv-456',
        'Cardiac Monitoring Device',
        'A wearable device for continuous cardiac monitoring',
        'Technical specifications for the cardiac monitoring device',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const result = designDocumentation.registerDesign(
        'design-123',
        'inv-789',
        'Another Device',
        'Description',
        'Specifications',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result.error).toBe(1);
  });
  
  it('should update an existing design and store version history', () => {
    designDocumentation.registerDesign(
        'design-123',
        'inv-456',
        'Cardiac Monitoring Device',
        'A wearable device for continuous cardiac monitoring',
        'Technical specifications v1',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const result = designDocumentation.updateDesign(
        'design-123',
        'Technical specifications v2',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result.success).toBe(true);
    expect(mockState.deviceDesigns['design-123'].version).toBe(2);
    expect(mockState.deviceDesigns['design-123'].specifications).toBe('Technical specifications v2');
    
    // Check version history
    const versionKey = 'design-123-1';
    expect(mockState.designVersions[versionKey]).toBeDefined();
    expect(mockState.designVersions[versionKey].specifications).toBe('Technical specifications v1');
  });
  
  it('should retrieve design details', () => {
    designDocumentation.registerDesign(
        'design-123',
        'inv-456',
        'Cardiac Monitoring Device',
        'A wearable device for continuous cardiac monitoring',
        'Technical specifications',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const design = designDocumentation.getDesignDetails('design-123');
    
    expect(design).toBeDefined();
    expect(design.name).toBe('Cardiac Monitoring Device');
    expect(design.inventorId).toBe('inv-456');
  });
  
  it('should retrieve a specific version of a design', () => {
    designDocumentation.registerDesign(
        'design-123',
        'inv-456',
        'Cardiac Monitoring Device',
        'A wearable device for continuous cardiac monitoring',
        'Technical specifications v1',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    designDocumentation.updateDesign(
        'design-123',
        'Technical specifications v2',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    const version1 = designDocumentation.getDesignVersion('design-123', 1);
    
    expect(version1).toBeDefined();
    expect(version1.specifications).toBe('Technical specifications v1');
  });
});
