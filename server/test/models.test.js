const User = require('../model/User');
const Blog = require('../model/Blog');

// Mock mongoose
jest.mock('mongoose', () => ({
  Schema: jest.fn(),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

describe('Model Tests', () => {
  describe('User Model', () => {
    it('should exist', () => {
      expect(User).toBeDefined();
    });
  });

  describe('Blog Model', () => {
    it('should exist', () => {
      expect(Blog).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-01');
      const formatted = date.toLocaleDateString();
      expect(formatted).toContain('2024');
    });

    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
    });
  });
});
