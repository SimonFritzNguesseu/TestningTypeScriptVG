import express, { json, Request, Response } from 'express';
import nock from "nock";
import mongoose, { Document, Schema, Model } from 'mongoose';
mongoose.set('strictQuery', false);
import axios from 'axios';
import { validateEmail, validateZipCode, validatePersonalNumber, validateText } from './validation';

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
    console.log('Request to create contact:', req.body);
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

        const contact = new ContactModel({ firstname, lastname, email, personalnumber, address, zipCode, city, country });
        console.log('Contact object before saving:', contact);
        const savedContact = await contact.save();
        console.log('Contact object after saving:', savedContact);
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
        console.log('Address:', address);
        nock("https://api-ninjas.com")
            .get("/api/geocoding")
            .query({ address })  // Make sure to use the actual query parameters
            .reply(200, { lat: 0, lng: 0 }); // Modify the response as per your needs

        // Replace the real API call with the mocked response
        const coordinatesAPI = await axios.get(`https://api-ninjas.com/api/geocoding?address=${address}`);

        // Use the mocked response for testing
        if (coordinatesAPI.data && coordinatesAPI.data.lat && coordinatesAPI.data.lng) {
            contact.lat = coordinatesAPI.data.lat;
            contact.lng = coordinatesAPI.data.lng;
        } else {
            return res.status(500).json({ error: 'Failed to retrieve coordinates' });
        }

        // Log the coordinates and the entire contact object
        console.log('Coordinates:', coordinatesAPI.data);
        console.log('Contact object with coordinates:', contact);

        res.status(200).json(contact);
    } catch (error: any) {
        if (error.kind && error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Invalid contact ID' });
        }
        res.status(500).json({ error: error.message });
    }
});

// ... (other routes and unchanged code)


const port = process.env.PORT || 8080;

mongoose.connect("mongodb+srv://Nguesseu:vegetadbz@planetvegeta.pbw070j.mongodb.net/test").then(() => {
    app.listen(port, () => {
        console.log(`App listening to port ${port}`);
    });
}).catch(err => console.error(err));

export default app;
