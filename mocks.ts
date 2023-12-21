const mockContactModel = () => ({
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn()
  });

  export default mockContactModel;
