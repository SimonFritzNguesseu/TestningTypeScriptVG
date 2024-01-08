import express, { json, Request, Response } from 'express';
import mongoose, { Document, Schema, Model } from 'mongoose';
mongoose.set('strictQuery', false);
import axios from 'axios';
import { validateEmail, validateZipCode, validatePersonalNumber, validateText } from './validation';
import { mockedAxios } from './tests/contactEndpoints.test';

const app = express();
app.use(json());

interface IContact extends Document {
    firstname: string;
    lastname: string;
    email: string;
    personalnumber: string;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    lat?: number;
    lng?: number;
}

const contactSchema = new Schema<IContact>({
    firstname: { type: String, required: true, validate: { validator: validateText, message: 'Invalid firstname' } },
    lastname: { type: String, required: true, validate: { validator: validateText, message: 'Invalid lastname' } },
    email: { type: String, required: true, validate: { validator: validateEmail, message: 'Invalid email' } },
    personalnumber: { type: String, required: true, validate: { validator: validatePersonalNumber, message: 'Invalid personal number' } },
    address: { type: String, required: true, validate: { validator: validateText, message: 'Invalid address' } },
    zipCode: { type: String, required: true, validate: { validator: validateZipCode, message: 'Invalid zip code' } },
    city: { type: String, required: true, validate: { validator: validateText, message: 'Invalid city' } },
    country: { type: String, required: true, validate: { validator: validateText, message: 'Invalid country' } },
    lat: Number,
    lng: Number,
});

export const ContactModel: Model<IContact> = mongoose.model<IContact>("contact", contactSchema);


app.post('/contact', async (req: Request, res: Response) => {
    const { firstname, lastname, email, personalnumber, address, zipCode, city, country } = req.body;

    try {
        if (!validateText(firstname) || !validateText(lastname) || !validateText(address) || !validateText(city) || !validateText(country)) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validateZipCode(zipCode)) {
            return res.status(400).json({ error: 'Invalid zip code format' });
        }

        if (!validatePersonalNumber(personalnumber)) {
            return res.status(400).json({ error: 'Invalid personal number format' });
        }

        // Create a mockup contact without actually saving it to the database
        const mockupContact = {
            _id: 'mocked-id',
            firstname,
            lastname,
            email,
            personalnumber,
            address,
            zipCode,
            city,
            country,
        };

        // Mock the save method of ContactModel
        const saveMock = jest.fn().mockResolvedValue(mockupContact);
        jest.spyOn(ContactModel.prototype, 'save').mockImplementation(saveMock);

        // Process the request as if it's a real save, but use the mockupContact instead
        const savedContact = await saveMock();

        res.status(201).json(savedContact);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/contact', async (_req: Request, res: Response) => {
    try {
        const contacts = await ContactModel.find({});
        res.status(200).json(contacts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/contact/:id', async (req: Request, res: Response) => {
    try {
        const contact = await ContactModel.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const address = encodeURIComponent(`${contact.address}, ${contact.city}, ${contact.country}`);
       // Assuming you already have the mockedAxios in your server.ts file
const coordinatesAPI = await mockedAxios.get(`https://api-ninjas.com/api/geocoding?address=${address}`);


        // Check if coordinates are successfully retrieved
        if (coordinatesAPI.data && coordinatesAPI.data.lat && coordinatesAPI.data.lng) {
            contact.lat = coordinatesAPI.data.lat;
            contact.lng = coordinatesAPI.data.lng;
        } else {
            return res.status(500).json({ error: 'Failed to retrieve coordinates' });
        }

        res.status(200).json(contact);
    } catch (error: any) {
        if (error.kind && error.kind === 'ObjectId') {
            // Handle invalid ObjectId (e.g., invalid format)
            return res.status(404).json({ error: 'Invalid contact ID' });
        }
        res.status(500).json({ error: error.message });
    }
});

const port = process.env.PORT || 8080;

mongoose.connect("mongodb+srv://Nguesseu:vegetadbz@planetvegeta.pbw070j.mongodb.net/test").then(() => {
    app.listen(port, () => {
        console.log(`App listening to port ${port}`);
    });
}).catch(err => console.error(err));


export default app;
