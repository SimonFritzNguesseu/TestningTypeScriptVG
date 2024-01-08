import request from 'supertest';
import app from '../server'; // Ensure the correct path to your server file
import mongoose from 'mongoose';
import axios from 'axios';

// Mock Axios before importing your models, as they might be used there
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a function to return a manual mock for the ContactModel
var mockContactModel = () => ({
  find: jest.fn(),
  findById: jest.fn(),
  save: jest.fn()
});

// Mock the mongoose model factory function
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    ContactModel: jest.fn(() => mockContactModel)
  };
});

// POST /contact tests
describe('POST /contact', () => {
  beforeEach(() => {
    // Define or redefine the mock implementations here
    const model = mockContactModel();
    model.find.mockResolvedValue([
      {
        _id: 'mocked-id-1',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        // ... other properties
      },
      // ... more mocked contacts
    ]);
    model.findById.mockImplementation((id: any) =>
      Promise.resolve(id === 'valid-contact-id' ? {
        _id: 'valid-contact-id',
        firstname: 'Jane',
        lastname: 'Doe',
        email: 'jane.doe@example.com',
        // ... other properties
      } : null)
    );
    model.save.mockResolvedValue({
      _id: 'mocked-id',
      firstname: 'Test',
      lastname: 'User',
      email: 'test.user@example.com',
      // ... other properties
    });

    // Mock Axios for geocoding API
    mockedAxios.get.mockResolvedValue({ data: { lat: 59.3251172, lng: 18.0710935 } })
  });

  it('should create a new contact and return 201 status', async () => {
    const newContact = {
      firstname: "Test",
      lastname: "Alm",
      email: "testuser123@gmail.com",
      personalnumber: "550713-1405",
      address: "Testgatan",
      zipCode: "12345",
      city: "Teststad",
      country: "Testland"
    };

    const response = await request(app).post('/contact').send(newContact);
    console.log(response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('_id');
  });

  it('should return 400 status for invalid input', async () => {
    const invalidContact = { firstname: "Test" }; // Missing required fields
    const response = await request(app).post('/contact').send(invalidContact);
    console.log(response.body);
    expect(response.statusCode).toBe(400);
  });
});

// GET /contact/:id tests
describe('GET /contact/:id', () => {
  it('should return a contact with coordinates and a 200 status', async () => {
    const response = await request(app).get('/contact/valid-contact-id');
    if (response.statusCode !== 200) {
      console.log('Response body:', response.body);
    }
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('lat', 59.3251172);
    expect(response.body).toHaveProperty('lng', 18.0710935);
  });

  it('should return 404 status for non-existing id', async () => {
    const response = await request(app).get('/contact/non-existing-id');
    if (response.statusCode !== 404) {
      console.log('Response body:', response.body);
    }
    expect(response.statusCode).toBe(404);
  });
});
