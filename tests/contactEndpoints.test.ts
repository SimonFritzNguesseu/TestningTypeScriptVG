import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import axios from 'axios';

jest.mock('axios');
export const mockedAxios = axios as jest.Mocked<typeof axios>;

var mockContactModel = () => ({
  find: jest.fn(),
  findById: jest.fn(),
  save: jest.fn()
});

jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    ContactModel: jest.fn(() => mockContactModel)
  };
});
describe('POST /contact', () => {
  beforeEach(() => {
    const model = mockContactModel();
    model.find.mockResolvedValue([
      {
        _id: 'mocked-id-1',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
      },
    ]);
    model.findById.mockImplementation((id: any) =>
      Promise.resolve(id === 'valid-contact-id' ? {
        _id: 'valid-contact-id',
        firstname: 'Jane',
        lastname: 'Doe',
        email: 'jane.doe@example.com',
      } : null)
    );
    model.save.mockResolvedValue({
      _id: 'mocked-id',
      firstname: 'Test',
      lastname: 'User',
      email: 'test.user@example.com',
    });

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
describe('GET /contact/:id', () => {
  it('should return a contact with coordinates and a 200 status', async () => {
    const response = await request(app).get('/contact/659be1c46f2eb67a28a5524e');
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
