const mockContactModel = jest.fn(() => ({
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  }));

  const mockSchema = {
    ...jest.requireActual('mongoose').Schema,
    constructor: mockContactModel,
  };

  const mongoose = {
    ...jest.requireActual('mongoose'),
    model: jest.fn(() => mockContactModel),
    Schema: jest.fn(() => mockSchema),
  };

  export default mongoose;
