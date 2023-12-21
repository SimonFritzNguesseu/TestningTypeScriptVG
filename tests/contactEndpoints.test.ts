import request from 'supertest';
import app from '../server';
import axios from 'axios';
import mongoose from '/Users/arvidalm/Documents/GitHub/TestningTypeScriptVG/__mocks__/mongoose'

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('Contact API endpoint tests', () => {
  beforeAll(() => {
    const mockContactModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    mongoose.model = jest.fn(() => mockContactModel);

    mockContactModel.find.mockResolvedValue([
      {
        _id: 'mocked-id-1',
        firstname: 'Arvid',
        lastname: 'Alm',
        email: 'Arvid.Alm@example.com',
      },
    ]);

    mockContactModel.findById.mockImplementation((id: any) =>
      Promise.resolve(
        id === 'valid-contact-id'
          ? {
              _id: 'valid-contact-id',
              firstname: 'Luke',
              lastname: 'Skywalker',
              email: 'Luke.Skywalker@example.com',
            }
          : null
      )
    );

    mockContactModel.create.mockResolvedValue({
      _id: 'mocked-id',
      firstname: 'Test',
      lastname: 'User',
      email: 'test.user@example.com',
    });

    mockedAxios.get.mockResolvedValue({ data: { lat: 59.3251172, lng: 18.0710935 } });
  });

  describe('POST /contact', () => {
    it('should create a new contact and return 201 status', async () => {
      const newContact = {
        firstname: 'Test',
        lastname: 'User',
        email: 'test.user@example.com',
        personalnumber: '550713-1405',
        address: 'Testgatan 1',
        zipCode: '123 45',
        city: 'Teststad',
        country: 'Testland',
      };

      const response = await request(app).post('/contact').send(newContact);
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('_id', 'mocked-id');
    });

    it('should return 400 status for invalid input', async () => {
      const invalidContact = { firstname: 'Test' };
      const response = await request(app).post('/contact').send(invalidContact);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /contact/:id', () => {
    it('should return a contact with coordinates and a 200 status', async () => {
      const response = await request(app).get('/contact/valid-contact-id');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('lat', 59.3251172);
      expect(response.body).toHaveProperty('lng', 18.0710935);
    });

    it('should return 404 status for non-existing id', async () => {
      const response = await request(app).get('/contact/non-existing-id');
      expect(response.statusCode).toBe(404);
    });
  });
});
